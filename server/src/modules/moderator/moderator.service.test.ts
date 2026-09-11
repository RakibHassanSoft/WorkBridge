import { JobStatus, TaskStatus, PayStatus, DisputeStatus, KycStatus, TrialOutcome } from "@prisma/client";

jest.mock("@/config/prisma", () => ({
  __esModule: true,
  default: {
    job: { findUnique: jest.fn(), update: jest.fn() },
    task: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() },
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
    const round = {
      id: "t1",
      jobId: "job1",
      status: TaskStatus.MATCHING,
      payment: { status: PayStatus.HELD },
      attempts: [
        { id: "a1", studentId: "s1", outcome: TrialOutcome.SHORTLISTED },
        { id: "a2", studentId: "s2", outcome: TrialOutcome.SHORTLISTED },
        { id: "a3", studentId: "s3", outcome: TrialOutcome.NOT_SHORTLISTED },
      ],
    };

    it("selects one (0), credits every other applicant +1, opens the task", async () => {
      db.task.findUnique.mockResolvedValue(round);

      const res = await moderatorService.selectStudent("t1", "s1", "clearest reasoning");

      expect(res.selected).toBe("s1");
      expect(res.creditedOthers).toBe(2);
      const ops = db.$transaction.mock.calls[0][0];
      // task->IN_PROGRESS, job->ACTIVE, selected update, selected pointEntry(0),
      // + for each of 2 others: attempt update + pointEntry(+1) = 4
      expect(ops.length).toBe(8);
      expect(db.trialAttempt.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "a1" }, data: expect.objectContaining({ points: 0 }) })
      );
      expect(db.trialAttempt.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "a2" }, data: expect.objectContaining({ points: 1 }) })
      );
    });

    it("only a student the AI shortlisted (90%+) can be selected", async () => {
      db.task.findUnique.mockResolvedValue(round);
      await expect(moderatorService.selectStudent("t1", "s3", "reason")).rejects.toMatchObject({ statusCode: 400 });
    });

    it("waits for the escrow to be funded before assigning anyone", async () => {
      db.task.findUnique.mockResolvedValue({ ...round, payment: { status: PayStatus.AWAITING } });
      await expect(moderatorService.selectStudent("t1", "s1", "reason")).rejects.toMatchObject({ statusCode: 409 });
    });

    it("refuses to select someone who did not do the trial", async () => {
      db.task.findUnique.mockResolvedValue(round);
      await expect(moderatorService.selectStudent("t1", "sX", "reason")).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe("listSelectRounds", () => {
    it("returns only the AI shortlist and counts what was filtered out", async () => {
      db.task.findMany.mockResolvedValue([
        {
          id: "t1",
          payment: { status: PayStatus.HELD },
          attempts: [
            { id: "a1", outcome: TrialOutcome.SHORTLISTED, completion: 100 },
            { id: "a2", outcome: TrialOutcome.NOT_SHORTLISTED, completion: 60 },
            { id: "a3", outcome: TrialOutcome.SHORTLISTED, completion: 92 },
          ],
        },
      ]);
      const [r] = await moderatorService.listSelectRounds();
      expect(r.attempts.map((a: any) => a.id)).toEqual(["a1", "a3"]);
      expect(r.belowBar).toBe(1);
      expect(r.bar).toBe(90);
      expect(r.funded).toBe(true);
    });
  });

  describe("approveScope (optional correction — posting needs no approval)", () => {
    it("re-prices a problem nobody has applied to yet", async () => {
      db.job.findUnique
        .mockResolvedValueOnce({ id: "job1", status: JobStatus.SCOPING, scopeApproved: true, tasks: [{ id: "t1", attempts: [], payment: { status: PayStatus.AWAITING } }] })
        .mockResolvedValueOnce({ id: "job1", tasks: [{ id: "t1" }] });
      await moderatorService.approveScope("job1", { fee: 7000 });
      expect(db.task.update).toHaveBeenCalledWith(expect.objectContaining({ data: { fee: 7000 } }));
      expect(db.payment.update).toHaveBeenCalledWith(expect.objectContaining({ data: { amount: 7000 } }));
    });

    it("will not re-price once someone has applied", async () => {
      db.job.findUnique.mockResolvedValueOnce({ id: "job1", status: JobStatus.MATCHING, tasks: [{ id: "t1", attempts: [{ id: "a1" }], payment: { status: PayStatus.HELD } }] });
      await expect(moderatorService.approveScope("job1", { fee: 7000 })).rejects.toMatchObject({ statusCode: 409 });
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
