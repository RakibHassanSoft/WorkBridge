import { PayStatus, TaskStatus, TrialCheckStatus } from "@prisma/client";

jest.mock("@/config/prisma", () => ({
  __esModule: true,
  default: {
    job: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    task: { findUnique: jest.fn(), update: jest.fn() },
    trialCheck: { update: jest.fn() },
    payment: { update: jest.fn(), findMany: jest.fn() },
    paymentMethod: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn() },
    evaluation: { update: jest.fn() },
    trialAttempt: { updateMany: jest.fn() },
    pointEntry: { create: jest.fn() },
    dispute: { create: jest.fn() },
    $transaction: jest.fn((ops: unknown[]) => Promise.resolve(ops)),
  },
}));

jest.mock("@/modules/ai/ai.service", () => ({
  aiService: {
    scope: jest.fn(),
    checkPrice: jest.fn(),
  },
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
      expect(arg.data.ref).toMatch(/^WB-/);
      expect(arg.data.budget).toBe(6000); // no budget -> suggestedFee
      expect(taskData.fee).toBe(6000);
      expect(taskData.trialCheck.create.status).toBe(TrialCheckStatus.AWAITING_CLIENT);
      expect(taskData.payment.create.status).toBe(PayStatus.AWAITING);
      expect(result.price.level).toBe("ok");
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

  describe("ownedTask", () => {
    it("forbids access to another client's task", async () => {
      db.task.findUnique.mockResolvedValue({ id: "t1", job: { clientId: "other" } });
      await expect(clientService.ownedTask("me", "t1")).rejects.toMatchObject({
        statusCode: 403,
      });
    });
  });

  describe("reviewTrial", () => {
    it("approves the trial (activation is handled by the shared gate)", async () => {
      db.task.findUnique.mockResolvedValue({
        id: "t1",
        jobId: "job1",
        status: "OPEN",
        job: { clientId: "me", status: "SCOPING", scopeApproved: false },
        trialCheck: { status: TrialCheckStatus.AWAITING_CLIENT },
        payment: { status: PayStatus.HELD },
      });
      db.trialCheck.update.mockResolvedValue({ status: TrialCheckStatus.APPROVED });

      await clientService.reviewTrial("me", "t1", { decision: "approve" });

      expect(db.trialCheck.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { taskId: "t1" } })
      );
    });

    it("records a change request without activating", async () => {
      db.task.findUnique.mockResolvedValue({
        id: "t1",
        job: { clientId: "me" },
        trialCheck: { status: TrialCheckStatus.AWAITING_CLIENT },
        payment: { status: PayStatus.AWAITING },
      });
      db.trialCheck.update.mockResolvedValue({ status: TrialCheckStatus.CHANGES_ASKED });
      await clientService.reviewTrial("me", "t1", { decision: "changes", note: "no" });
      expect(db.task.update).not.toHaveBeenCalled();
    });
  });

  describe("depositEscrow", () => {
    it("blocks funding an underpriced task", async () => {
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
      await expect(
        clientService.depositEscrow("me", "t1", {})
      ).rejects.toMatchObject({ statusCode: 400 });
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
      expect(res.payment.status).toBe(PayStatus.HELD);
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
