import { KycStatus, TaskStatus, TrialCheckStatus, PayStatus } from "@prisma/client";

jest.mock("@/config/prisma", () => ({
  __esModule: true,
  default: {
    user: { findUnique: jest.fn() },
    studentProfile: { findUnique: jest.fn(), update: jest.fn() },
    kycSubmission: { findFirst: jest.fn(), create: jest.fn() },
    task: { findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    trialAttempt: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
    pointEntry: { findMany: jest.fn() },
    payment: { findMany: jest.fn() },
    dispute: { create: jest.fn() },
  },
}));

jest.mock("@/modules/ai/ai.service", () => ({
  aiService: { evaluateAttempt: jest.fn() },
}));

import prisma from "@/config/prisma";
import { aiService } from "@/modules/ai/ai.service";
import { studentService } from "./student.service";

const db = prisma as any;
const ai = aiService as jest.Mocked<typeof aiService>;

describe("studentService", () => {
  describe("submitKyc", () => {
    it("stores documents as unverified and pending", async () => {
      db.kycSubmission.findFirst.mockResolvedValue(null);
      db.kycSubmission.create.mockImplementation(({ data }: any) => data);
      const res = await studentService.submitKyc("s1", [
        { label: "Recommendation letter", detail: "signed", ok: true },
      ]);
      expect(res.status).toBe(KycStatus.PENDING);
      expect((res.documents as any[])[0].ok).toBe(false); // moderator clears it, not the student
    });

    it("refuses a second submission while one is pending", async () => {
      db.kycSubmission.findFirst.mockResolvedValue({ status: KycStatus.PENDING });
      await expect(studentService.submitKyc("s1", [])).rejects.toMatchObject({
        statusCode: 409,
      });
    });
  });

  describe("applyToTrial", () => {
    it("blocks an unverified student", async () => {
      db.studentProfile.findUnique.mockResolvedValue({ kycStatus: KycStatus.PENDING });
      await expect(
        studentService.applyToTrial("s1", "t1", { summary: "did the work", minutesTaken: 30 })
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it("blocks applying to a task that is not live", async () => {
      db.studentProfile.findUnique.mockResolvedValue({ kycStatus: KycStatus.VERIFIED });
      db.task.findUnique.mockResolvedValue({
        id: "t1",
        status: TaskStatus.OPEN,
        trialCheck: { status: TrialCheckStatus.AWAITING_CLIENT },
        trial: { id: "tr1" },
      });
      await expect(
        studentService.applyToTrial("s1", "t1", { summary: "x".repeat(20), minutesTaken: 30 })
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it("rejects a duplicate application", async () => {
      db.studentProfile.findUnique.mockResolvedValue({ kycStatus: KycStatus.VERIFIED });
      db.task.findUnique.mockResolvedValue({
        id: "t1",
        status: TaskStatus.MATCHING,
        trialCheck: { status: TrialCheckStatus.APPROVED },
        trial: { id: "tr1", title: "t", brief: "b", mirrors: "m", minutes: 40 },
      });
      db.trialAttempt.findUnique.mockResolvedValue({ id: "a1" });
      await expect(
        studentService.applyToTrial("s1", "t1", { summary: "x".repeat(20), minutesTaken: 30 })
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it("creates an AI-scored attempt for a verified student on a live task", async () => {
      db.studentProfile.findUnique.mockResolvedValue({ kycStatus: KycStatus.VERIFIED });
      db.task.findUnique.mockResolvedValue({
        id: "t1",
        status: TaskStatus.MATCHING,
        trialCheck: { status: TrialCheckStatus.APPROVED },
        trial: { id: "tr1", title: "t", brief: "b", mirrors: "m", minutes: 40 },
      });
      db.trialAttempt.findUnique.mockResolvedValue(null);
      ai.evaluateAttempt.mockResolvedValue({
        score: 82,
        verdict: "good",
        coaching: "tip",
        breakdown: [],
      });
      db.trialAttempt.create.mockImplementation(({ data }: any) => data);

      const res = await studentService.applyToTrial("s1", "t1", {
        summary: "I did the work and flagged the unclear item",
        minutesTaken: 35,
      });
      expect(ai.evaluateAttempt).toHaveBeenCalled();
      expect(res.aiScore).toBe(82);
      expect(res.points).toBe(0); // no points until selection
    });
  });

  describe("submitWork", () => {
    it("moves an in-progress task to review", async () => {
      db.task.findUnique.mockResolvedValue({
        id: "t1",
        assigneeId: "s1",
        status: TaskStatus.IN_PROGRESS,
      });
      db.task.update.mockImplementation(({ data }: any) => data);
      const res = await studentService.submitWork("s1", "t1", "done, files attached");
      expect(res.status).toBe(TaskStatus.IN_REVIEW);
      expect(res.progress).toBe(100);
    });

    it("refuses to submit a task not assigned to the student", async () => {
      db.task.findUnique.mockResolvedValue({ id: "t1", assigneeId: "other" });
      await expect(
        studentService.submitWork("s1", "t1", "note here")
      ).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  describe("earnings", () => {
    it("sums released payments for the student", async () => {
      db.payment.findMany.mockResolvedValue([
        { amount: 6000, status: PayStatus.RELEASED, task: { id: "t1", title: "a" } },
        { amount: 3000, status: PayStatus.RELEASED, task: { id: "t2", title: "b" } },
      ]);
      const res = await studentService.earnings("s1");
      expect(res.total).toBe(9000);
    });
  });
});
