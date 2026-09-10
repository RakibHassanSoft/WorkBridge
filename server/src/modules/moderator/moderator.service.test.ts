import { JobStatus, TaskStatus, PayStatus, DisputeStatus, KycStatus } from "@prisma/client";

jest.mock("@/config/prisma", () => ({
  __esModule: true,
  default: {
    job: { findUnique: jest.fn(), update: jest.fn() },
    task: { findUnique: jest.fn(), update: jest.fn() },
    payment: { findUnique: jest.fn(), update: jest.fn() },
    trialAttempt: { update: jest.fn(), updateMany: jest.fn() },
    pointEntry: { create: jest.fn() },
    evaluation: { upsert: jest.fn() },
    kycSubmission: { findUnique: jest.fn(), update: jest.fn() },
    studentProfile: { update: jest.fn() },
    dispute: { findUnique: jest.fn(), update: jest.fn() },
    $transaction: jest.fn((ops: unknown[]) => Promise.resolve(ops)),
  },
}));
jest.mock("@/modules/task/task.service", () => ({
  taskService: { maybeActivate: jest.fn() },
}));

import prisma from "@/config/prisma";
import { moderatorService } from "./moderator.service";

const db = prisma as any;

describe("moderatorService", () => {
  describe("selectStudent (points resolution)", () => {
    it("selects one (0), credits every other applicant +1, opens the task", async () => {
      db.task.findUnique.mockResolvedValue({
        id: "t1",
        jobId: "job1",
        status: TaskStatus.MATCHING,
        attempts: [
          { id: "a1", studentId: "s1" },
          { id: "a2", studentId: "s2" },
          { id: "a3", studentId: "s3" },
        ],
      });

      const res = await moderatorService.selectStudent("t1", "s1", "clearest reasoning");

      expect(res.selected).toBe("s1");
      expect(res.creditedOthers).toBe(2);
      const ops = db.$transaction.mock.calls[0][0];
      // task->IN_PROGRESS, job->ACTIVE, selected update, selected pointEntry(0),
      // + for each of 2 others: attempt update + pointEntry(+1) = 4
      expect(ops.length).toBe(8);
      // selected gets 0
      expect(db.trialAttempt.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "a1" }, data: expect.objectContaining({ points: 0 }) })
      );
      // an other gets +1
      expect(db.trialAttempt.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "a2" }, data: expect.objectContaining({ points: 1 }) })
      );
    });

    it("refuses to select someone who did not do the trial", async () => {
      db.task.findUnique.mockResolvedValue({
        id: "t1",
        status: TaskStatus.MATCHING,
        attempts: [{ id: "a1", studentId: "s1" }],
      });
      await expect(
        moderatorService.selectStudent("t1", "sX", "reason")
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe("approveScope", () => {
    it("releases the scope and tries to activate each task", async () => {
      const { taskService } = jest.requireMock("@/modules/task/task.service");
      db.job.findUnique
        .mockResolvedValueOnce({ id: "job1", scopeApproved: false, tasks: [{ id: "t1" }] })
        .mockResolvedValueOnce({ id: "job1", tasks: [{ id: "t1" }] });
      await moderatorService.approveScope("job1", {});
      expect(db.job.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ scopeApproved: true }) })
      );
      expect(taskService.maybeActivate).toHaveBeenCalledWith("t1");
    });
  });

  describe("decideKyc", () => {
    it("verifies the student and clears every document", async () => {
      db.kycSubmission.findUnique.mockResolvedValue({
        id: "k1",
        subjectId: "s1",
        documents: [{ label: "Letter", detail: "x", ok: false }],
      });
      const r = await moderatorService.decideKyc("k1", { decision: "approve" });
      expect(r.status).toBe(KycStatus.VERIFIED);
      expect(db.studentProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { kycStatus: KycStatus.VERIFIED } })
      );
    });
  });

  describe("ruleDispute", () => {
    it("client refund resolves the student's point to -1", async () => {
      db.dispute.findUnique.mockResolvedValue({
        id: "d1",
        ref: "DSP-1",
        taskId: "t1",
        status: DisputeStatus.OPEN,
        task: { assigneeId: "s1" },
      });
      await moderatorService.ruleDispute("d1", { outcome: "client", resolution: "not delivered" });
      const ops = db.$transaction.mock.calls[0][0];
      expect(db.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: PayStatus.REFUNDED }) })
      );
      expect(db.pointEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ delta: -1 }) })
      );
      expect(ops.length).toBe(4); // dispute, payment, attempt updateMany, pointEntry
    });

    it("student release does not dock a point", async () => {
      db.dispute.findUnique.mockResolvedValue({
        id: "d2",
        ref: "DSP-2",
        taskId: "t2",
        status: DisputeStatus.OPEN,
        task: { assigneeId: "s1" },
      });
      await moderatorService.ruleDispute("d2", { outcome: "student", resolution: "delivered fine" });
      expect(db.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: PayStatus.RELEASED }) })
      );
      expect(db.pointEntry.create).not.toHaveBeenCalled();
    });
  });

  describe("refund", () => {
    it("only refunds held escrow", async () => {
      db.payment.findUnique.mockResolvedValue({ taskId: "t1", status: PayStatus.RELEASED });
      await expect(moderatorService.refund("t1", "x")).rejects.toMatchObject({ statusCode: 409 });
    });
  });
});
