import { KycStatus, TaskStatus, TrialCheckStatus, PayStatus, TrialOutcome } from "@prisma/client";

jest.mock("@/config/prisma", () => ({
  __esModule: true,
  default: {
    user: { findUnique: jest.fn() },
    studentProfile: { findUnique: jest.fn(), update: jest.fn() },
    kycSubmission: { findFirst: jest.fn(), create: jest.fn() },
    task: { findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    trialAttempt: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    $transaction: jest.fn((ops: unknown[]) => Promise.resolve(ops)),
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

    const live = {
      id: "t1",
      status: TaskStatus.MATCHING,
      acceptance: ["done means done"],
      trialCheck: { status: TrialCheckStatus.APPROVED },
      trial: { id: "tr1", title: "t", brief: "b", mirrors: "m", minutes: 40, acceptance: ["Produce: x", "Upload the files you produced (not only a description)"] },
    };
    const judged = (completion: number, shortlisted: boolean) => ({
      score: 82,
      completion,
      shortlisted,
      checklist: [{ requirement: "Produce: x", status: shortlisted ? "met" : "partial", evidence: "e" }],
      flags: [],
      verdict: "good",
      coaching: "tip",
      breakdown: [],
      source: "engine",
    });

    it("judges the upload against the TRIAL's requirements and shortlists at 90%+", async () => {
      db.studentProfile.findUnique.mockResolvedValue({ kycStatus: KycStatus.VERIFIED });
      db.task.findUnique.mockResolvedValue(live);
      db.trialAttempt.findUnique.mockResolvedValue(null);
      ai.evaluateAttempt.mockResolvedValue(judged(95, true) as any);
      db.trialAttempt.create.mockImplementation(({ data }: any) => ({ id: "a1", ...data }));
      db.trialAttempt.findMany.mockResolvedValue([
        { id: "a0", completion: 100, aiScore: 90, submittedAt: new Date("2026-01-01") },
        { id: "a1", completion: 95, aiScore: 82, submittedAt: new Date("2026-01-02") },
      ]);

      const res = await studentService.applyToTrial("s1", "t1", {
        summary: "I did the work and flagged the unclear item",
        minutesTaken: 35,
        attachments: [{ kind: "file", name: "a.png", files: [{ name: "a.png", mime: "image/png", size: 10, content: null, data: "QUJD" }] }],
      });

      const evalArg = (ai.evaluateAttempt as jest.Mock).mock.calls[0][0];
      expect(evalArg.requirements).toEqual(live.trial.acceptance); // the trial checklist, not the task's
      expect(evalArg.attachments[0].files[0].data).toBe("QUJD"); // the judge sees the image
      const stored = db.trialAttempt.create.mock.calls[0][0].data;
      expect(stored.attachments[0].files[0].data).toBeUndefined(); // …but it is never stored
      expect(stored.outcome).toBe(TrialOutcome.SHORTLISTED);
      expect(stored.completion).toBe(95);
      expect(stored.points).toBe(0); // no points until selection
      expect(res.rank).toBe(2); // ranked behind the 100% attempt
      expect(res.shortlisted).toBe(true);
    });

    it("gives the judge the other students' work so a copy is caught", async () => {
      db.studentProfile.findUnique.mockResolvedValue({ kycStatus: KycStatus.VERIFIED });
      db.task.findUnique.mockResolvedValue(live);
      db.trialAttempt.findUnique.mockResolvedValue(null);
      ai.evaluateAttempt.mockResolvedValue(judged(20, false) as any);
      db.trialAttempt.create.mockImplementation(({ data }: any) => ({ id: "a3", ...data }));
      db.trialAttempt.findMany.mockResolvedValue([
        { attachments: [{ kind: "file", name: "x.md", files: [{ name: "x.md", mime: "text/markdown", size: 5, content: "peer work text" }] }] },
      ]);
      await studentService.applyToTrial("s1", "t1", { summary: "my own work here", minutesTaken: 30 });
      expect((ai.evaluateAttempt as jest.Mock).mock.calls[0][0].peers).toEqual(["# x.md\npeer work text"]);
    });

    it("keeps an attempt under the bar away from the moderator", async () => {
      db.studentProfile.findUnique.mockResolvedValue({ kycStatus: KycStatus.VERIFIED });
      db.task.findUnique.mockResolvedValue(live);
      db.trialAttempt.findUnique.mockResolvedValue(null);
      ai.evaluateAttempt.mockResolvedValue(judged(70, false) as any);
      db.trialAttempt.create.mockImplementation(({ data }: any) => ({ id: "a2", ...data }));
      db.trialAttempt.findMany.mockResolvedValue([]);

      const res = await studentService.applyToTrial("s1", "t1", { summary: "partial work here", minutesTaken: 35 });
      expect(db.trialAttempt.create.mock.calls[0][0].data.outcome).toBe(TrialOutcome.NOT_SHORTLISTED);
      expect(res.rank).toBe(0);
      expect(res.shortlisted).toBe(false);
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
