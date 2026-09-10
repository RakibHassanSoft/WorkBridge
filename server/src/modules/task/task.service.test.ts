import { JobStatus, PayStatus, TaskStatus, TrialCheckStatus } from "@prisma/client";

jest.mock("@/config/prisma", () => ({
  __esModule: true,
  default: {
    task: { findUnique: jest.fn(), update: jest.fn() },
    job: { update: jest.fn() },
    $transaction: jest.fn((ops: unknown[]) => Promise.resolve(ops)),
  },
}));

import prisma from "@/config/prisma";
import { taskService } from "./task.service";

const db = prisma as any;

const ready = {
  id: "t1",
  jobId: "job1",
  status: TaskStatus.OPEN,
  job: { scopeApproved: true, status: JobStatus.SCOPING },
  trialCheck: { status: TrialCheckStatus.APPROVED },
  payment: { status: PayStatus.HELD },
};

describe("taskService.maybeActivate", () => {
  it("activates only when all three gates are cleared", async () => {
    db.task.findUnique.mockResolvedValue(ready);
    const res = await taskService.maybeActivate("t1");
    expect(db.$transaction).toHaveBeenCalled();
    expect((res as any).status).toBe(TaskStatus.MATCHING);
  });

  it("does not activate when the moderator has not released the scope", async () => {
    db.task.findUnique.mockResolvedValue({ ...ready, job: { scopeApproved: false } });
    await taskService.maybeActivate("t1");
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("does not activate when the escrow is not held", async () => {
    db.task.findUnique.mockResolvedValue({ ...ready, payment: { status: PayStatus.AWAITING } });
    await taskService.maybeActivate("t1");
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("does not activate when the trial is not approved", async () => {
    db.task.findUnique.mockResolvedValue({
      ...ready,
      trialCheck: { status: TrialCheckStatus.AWAITING_CLIENT },
    });
    await taskService.maybeActivate("t1");
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});
