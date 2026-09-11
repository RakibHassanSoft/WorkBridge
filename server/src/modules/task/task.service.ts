import { JobStatus, TaskStatus, TrialCheckStatus } from "@prisma/client";
import prisma from "@/config/prisma";

/**
 * Shared task lifecycle. Posting needs no approval: a task goes live on the
 * board (MATCHING) as soon as the CLIENT approves the AI-built trial. Escrow is
 * not a gate for going live — it is a gate for SELECTION (the moderator cannot
 * assign a student until the fee is held), so no student starts unfunded work.
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
      task.job.status !== JobStatus.CANCELLED &&
      task.trialCheck?.status === TrialCheckStatus.APPROVED;

    if (!ready) return task;

    await prisma.$transaction([
      prisma.task.update({ where: { id: taskId }, data: { status: TaskStatus.MATCHING } }),
      prisma.job.update({ where: { id: task.jobId }, data: { status: JobStatus.MATCHING } }),
    ]);
    return { ...task, status: TaskStatus.MATCHING };
  },
};

export type TaskService = typeof taskService;
