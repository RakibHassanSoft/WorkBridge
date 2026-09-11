import { PayStatus, TaskStatus, TrialCheckStatus } from "@prisma/client";

jest.mock("@/config/prisma", () => ({
  __esModule: true,
  default: {
    job: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    sector: { upsert: jest.fn() },
    task: { findUnique: jest.fn(), update: jest.fn() },
    trialCheck: { update: jest.fn() },
    trial: { update: jest.fn() },
    payment: { update: jest.fn(), findMany: jest.fn() },
    paymentMethod: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn() },
    evaluation: { update: jest.fn() },
    trialAttempt: { updateMany: jest.fn(), groupBy: jest.fn() },
    pointEntry: { create: jest.fn() },
    dispute: { create: jest.fn() },
    $transaction: jest.fn((ops: unknown[]) => Promise.resolve(ops)),
  },
}));

jest.mock("@/modules/ai/ai.service", () => ({
  aiService: {
    scope: jest.fn(),
    checkPrice: jest.fn(),
    rebuildTrial: jest.fn(),
  },
}));
jest.mock("@/modules/task/task.service", () => ({
  taskService: { maybeActivate: jest.fn() },
}));

import prisma from "@/config/prisma";
import { aiService } from "@/modules/ai/ai.service";
import { clientService } from "./client.service";

const db = prisma as any;
const ai = aiService as jest.Mocked<typeof aiService>;

const scopeFixture = {
  sectorId: "it",
  summary: "s",
  complexity: "Low",
  confidence: 80,
  estHours: 10,
  suggestedFee: 6000,
  level: "standard",
  skills: ["Debugging"],
  risks: ["r"],
  acceptance: ["a"],
  title: "Fix checkout",
  desc: "d",
  signals: [],
  trial: { title: "t", brief: "b", minutes: 40, mirrors: "m", acceptance: ["x"] },
  price: { rate: 600, floor: 480, fair: true, shortfall: 0, gapPct: 0, level: "ok", message: "ok" },
} as any;

describe("clientService", () => {
  describe("postJob", () => {
    it("scopes the brief and persists job+task+trial+trialCheck+unfunded payment", async () => {
      ai.scope.mockResolvedValue(scopeFixture);
      db.job.create.mockResolvedValue({ id: "job1" });

      const result = await clientService.postJob("client1", {
        brief: "checkout payment failing on my website",
      });

      const arg = db.job.create.mock.calls[0][0];
      const taskData = arg.data.tasks.create;
      expect(arg.data.ref).toMatch(/^BD-/);
      expect(arg.data.budget).toBe(6000); // no budget -> suggestedFee
      expect(taskData.fee).toBe(6000);
      expect(taskData.trialCheck.create.status).toBe(TrialCheckStatus.AWAITING_CLIENT);
      expect(taskData.payment.create.status).toBe(PayStatus.AWAITING);
      expect(arg.data.scopeApproved).toBe(true); // stored at once — no approval step
      expect(result.price.level).toBe("ok");
    });

    it("never stores the base64 of uploaded brief documents", async () => {
      ai.scope.mockResolvedValue(scopeFixture);
      db.job.create.mockResolvedValue({ id: "job3" });
      await clientService.postJob("client1", {
        brief: "x".repeat(20),
        attachments: [{ kind: "file", name: "a.png", files: [{ name: "a.png", mime: "image/png", size: 10, content: null, data: "QUJD" }] }],
      });
      const stored = db.job.create.mock.calls[0][0].data.attachments;
      expect(stored[0].files[0].data).toBeUndefined();
    });

    it("uses the client's budget when provided", async () => {
      ai.scope.mockResolvedValue(scopeFixture);
      db.job.create.mockResolvedValue({ id: "job2" });
      await clientService.postJob("client1", { brief: "x".repeat(20), budget: 9000 });
      const arg = db.job.create.mock.calls[0][0];
      expect(arg.data.budget).toBe(9000);
      expect(arg.data.tasks.create.fee).toBe(9000);
    });
  });

  describe("listJobs", () => {
    it("adds trial stats (applicants, AI-shortlisted) without naming anyone", async () => {
      db.job.findMany.mockResolvedValue([{ id: "j1", tasks: [{ id: "t1" }, { id: "t2" }] }]);
      db.trialAttempt.groupBy.mockResolvedValue([
        { taskId: "t1", outcome: "SHORTLISTED", _count: { _all: 2 } },
        { taskId: "t1", outcome: "NOT_SHORTLISTED", _count: { _all: 3 } },
      ]);
      const [j] = (await clientService.listJobs("me")) as any[];
      expect(j.tasks[0].trialStats).toEqual({ applicants: 5, shortlisted: 2 });
      expect(j.tasks[1].trialStats).toEqual({ applicants: 0, shortlisted: 0 });
    });
  });

  describe("ownedTask", () => {
    it("forbids access to another client's task", async () => {
      db.task.findUnique.mockResolvedValue({ id: "t1", job: { clientId: "other" } });
      await expect(clientService.ownedTask("me", "t1")).rejects.toMatchObject({
        statusCode: 403,
      });
    });
  });

  describe("reviewTrial", () => {
    const owned = {
      id: "t1",
      jobId: "job1",
      status: "OPEN",
      hours: 10,
      sectorId: "it",
      sector: { name: "IT & Software" },
      job: { clientId: "me", status: "SCOPING", scopeApproved: true, brief: "Build an inventory dashboard and a daily sales report.", attachments: null },
      trial: { title: "old", brief: "old brief", acceptance: ["a", "b"], revision: 1 },
      trialCheck: { status: TrialCheckStatus.AWAITING_CLIENT },
      payment: { status: PayStatus.AWAITING },
    };

    it("approving puts the task live on the board (even before funding)", async () => {
      const { taskService } = jest.requireMock("@/modules/task/task.service");
      db.task.findUnique.mockResolvedValue(owned);
      db.trialCheck.update.mockResolvedValue({ status: TrialCheckStatus.APPROVED });

      const res = await clientService.reviewTrial("me", "t1", { decision: "approve" });

      expect(db.trialCheck.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { taskId: "t1" }, data: expect.objectContaining({ status: TrialCheckStatus.APPROVED }) })
      );
      expect(taskService.maybeActivate).toHaveBeenCalledWith("t1");
      expect((res as any).live).toBe(true);
    });

    it("asking for changes makes the AI rebuild the trial and hands it back for approval", async () => {
      const { taskService } = jest.requireMock("@/modules/task/task.service");
      db.task.findUnique.mockResolvedValue(owned);
      ai.rebuildTrial.mockResolvedValue({ title: "new", brief: "new brief", minutes: 45, mirrors: "m", acceptance: ["x", "y", "z"] });
      db.trial.update.mockResolvedValue({ title: "new" });
      db.trialCheck.update.mockResolvedValue({ status: TrialCheckStatus.AWAITING_CLIENT });

      const res = await clientService.reviewTrial("me", "t1", { decision: "changes", note: "test the sales report too" });

      expect(ai.rebuildTrial).toHaveBeenCalledWith(expect.objectContaining({ note: "test the sales report too", sectorId: "it" }));
      expect(db.trial.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ title: "new", acceptance: ["x", "y", "z"], revision: { increment: 1 } }) })
      );
      expect(db.trialCheck.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: TrialCheckStatus.AWAITING_CLIENT }) })
      );
      expect(taskService.maybeActivate).not.toHaveBeenCalled();
      expect((res as any).rebuilt).toBe(true);
    });

    it("refuses a change request with no note", async () => {
      db.task.findUnique.mockResolvedValue(owned);
      await expect(clientService.reviewTrial("me", "t1", { decision: "changes", note: " " })).rejects.toMatchObject({ statusCode: 400 });
    });

    it("refuses to review a trial that is already approved", async () => {
      db.task.findUnique.mockResolvedValue({ ...owned, trialCheck: { status: TrialCheckStatus.APPROVED } });
      await expect(clientService.reviewTrial("me", "t1", { decision: "approve" })).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  describe("depositEscrow", () => {
    it("funds even an 'underpriced' task — price is informational, never a block", async () => {
      db.task.findUnique.mockResolvedValue({
        id: "t1",
        fee: 1000,
        hours: 10,
        sectorId: "it",
        job: { clientId: "me" },
        payment: { status: PayStatus.AWAITING },
        trialCheck: { status: TrialCheckStatus.AWAITING_CLIENT },
      });
      ai.checkPrice.mockReturnValue({ level: "blocked", message: "too low" } as any);
      db.payment.update.mockResolvedValue({ status: PayStatus.HELD });

      const res = await clientService.depositEscrow("me", "t1", {});
      expect(db.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: PayStatus.HELD }) })
      );
      expect(res.gatewayUrl).toBeNull(); // no gateway configured in tests -> held at once
      expect(res.payment?.status).toBe(PayStatus.HELD);
      // the verdict is still returned for the UI to show, just not enforced
      expect(res.fairPrice.level).toBe("blocked");
    });

    it("moves the escrow to HELD on a fair price", async () => {
      db.task.findUnique.mockResolvedValue({
        id: "t1",
        fee: 6000,
        hours: 10,
        sectorId: "it",
        job: { clientId: "me" },
        payment: { status: PayStatus.AWAITING },
        trialCheck: { status: TrialCheckStatus.AWAITING_CLIENT },
      });
      ai.checkPrice.mockReturnValue({ level: "ok", message: "ok" } as any);
      db.payment.update.mockResolvedValue({ status: PayStatus.HELD });

      const res = await clientService.depositEscrow("me", "t1", {});
      expect(db.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: PayStatus.HELD }) })
      );
      expect(res.gatewayUrl).toBeNull(); // no gateway configured in tests -> held at once
      expect(res.payment?.status).toBe(PayStatus.HELD);
    });
  });

  describe("signOff", () => {
    const heldTask = {
      id: "t1",
      jobId: "job1",
      assigneeId: "stu1",
      job: { clientId: "me" },
      payment: { status: PayStatus.HELD },
      evaluation: { id: "e1" },
    };

    it("accept releases the escrow and credits the student 0", async () => {
      db.task.findUnique.mockResolvedValue(heldTask);
      const res = await clientService.signOff("me", "t1", { decision: "accept" });
      expect(res.released).toBe(true);
      // transaction included a payment RELEASED update and a point entry
      const ops = db.$transaction.mock.calls[0][0];
      expect(ops.length).toBeGreaterThanOrEqual(5);
      expect(db.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: PayStatus.RELEASED }) })
      );
      expect(db.pointEntry.create).toHaveBeenCalled();
    });

    it("revision keeps the escrow held", async () => {
      db.task.findUnique.mockResolvedValue(heldTask);
      const res = await clientService.signOff("me", "t1", { decision: "revision" });
      expect(res.released).toBe(false);
      expect(db.payment.update).not.toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: PayStatus.RELEASED }) })
      );
    });

    it("refuses to sign off before any evaluation exists", async () => {
      db.task.findUnique.mockResolvedValue({ ...heldTask, evaluation: null });
      await expect(
        clientService.signOff("me", "t1", { decision: "accept" })
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe("raiseDispute", () => {
    it("rejects a second dispute on the same task", async () => {
      db.task.findUnique.mockResolvedValue({
        id: "t1",
        job: { clientId: "me" },
        dispute: { id: "d1" },
      });
      await expect(
        clientService.raiseDispute("me", "t1", { claim: "bad", amount: 100 })
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it("creates a dispute when none exists", async () => {
      db.task.findUnique.mockResolvedValue({ id: "t1", job: { clientId: "me" }, dispute: null });
      db.dispute.create.mockResolvedValue({ id: "d1", ref: "DSP-XYZ" });
      const d = await clientService.raiseDispute("me", "t1", {
        claim: "not delivered",
        amount: 500,
      });
      expect(d.ref).toMatch(/^DSP-/);
    });
  });
});
