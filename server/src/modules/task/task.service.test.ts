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

const posted = {
  id: "t1",
  jobId: "job1",
  status: TaskStatus.OPEN,
  job: { scopeApproved: true, status: JobStatus.SCOPING },
  trialCheck: { status: TrialCheckStatus.APPROVED },
  payment: { status: PayStatus.AWAITING },
};

describe("taskService.maybeActivate", () => {
  it("goes live as soon as the client approves the trial — no moderator or escrow gate", async () => {
    db.task.findUnique.mockResolvedValue(posted);
    const res = await taskService.maybeActivate("t1");
    expect(db.$transaction).toHaveBeenCalled();
    expect((res as any).status).toBe(TaskStatus.MATCHING);
  });

  it("does not go live while the trial is waiting for the client", async () => {
    db.task.findUnique.mockResolvedValue({ ...posted, trialCheck: { status: TrialCheckStatus.AWAITING_CLIENT } });
    await taskService.maybeActivate("t1");
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("does not revive a cancelled problem", async () => {
    db.task.findUnique.mockResolvedValue({ ...posted, job: { status: JobStatus.CANCELLED } });
    await taskService.maybeActivate("t1");
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("does nothing for a task that is already live", async () => {
    db.task.findUnique.mockResolvedValue({ ...posted, status: TaskStatus.MATCHING });
    await taskService.maybeActivate("t1");
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});
