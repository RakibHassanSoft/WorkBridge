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

  /**
   * Public task board: every real task that has gone live (the client approved
   * its trial), newest first, with the fields the /tasks page renders. No demo
   * data — this is straight from the database. Drafts still waiting for the
   * client's trial check are not shown; nothing is hidden once it is live.
   */
  listBoard() {
    return prisma.task.findMany({
      where: {
        job: { status: { not: JobStatus.CANCELLED } },
        trialCheck: { status: TrialCheckStatus.APPROVED },
      },
      orderBy: { createdAt: "desc" },
      include: {
        sector: true,
        trial: { select: { title: true, minutes: true, mirrors: true } },
        job: {
          select: {
            ref: true,
            title: true,
            brief: true,
            aiSummary: true,
            createdAt: true,
            client: {
              select: {
                id: true,
                name: true,
                clientProfile: { select: { businessName: true, city: true, industry: true } },
              },
            },
          },
        },
        _count: { select: { attempts: true } },
      },
    });
  },
};

export type TaskService = typeof taskService;
