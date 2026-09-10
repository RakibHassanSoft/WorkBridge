import { JobStatus, PayStatus, TaskStatus, TrialCheckStatus } from "@prisma/client";
import prisma from "@/config/prisma";

/**
 * Shared task lifecycle. A task goes live on the board (MATCHING) only when all
 * three gates are cleared:
 *   1. the moderator has released the AI scope (job.scopeApproved)
 *   2. the client has approved the trial (trialCheck APPROVED)
 *   3. the escrow is funded (payment HELD)
 * Any of the client, or the moderator, can be the last to clear a gate, so each
 * of their actions calls this to check whether the task can now go live.
 */
export const taskService = {
  async maybeActivate(taskId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { job: true, trialCheck: true, payment: true },
    });
    if (!task) return null;

    const ready =
      task.status === TaskStatus.OPEN &&
      task.job.scopeApproved &&
      task.trialCheck?.status === TrialCheckStatus.APPROVED &&
      task.payment?.status === PayStatus.HELD;

    if (!ready) return task;

    await prisma.$transaction([
      prisma.task.update({ where: { id: taskId }, data: { status: TaskStatus.MATCHING } }),
      prisma.job.update({ where: { id: task.jobId }, data: { status: JobStatus.MATCHING } }),
    ]);
    return { ...task, status: TaskStatus.MATCHING };
  },
};

export type TaskService = typeof taskService;
