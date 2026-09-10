import { Role } from "@prisma/client";
import prisma from "@/config/prisma";
import { AppError } from "@/utils/AppError";

/**
 * Task-scoped chat. A thread exists per task and opens once a student has been
 * put forward (task.assigneeId set). Participants are the job's client, the
 * assigned student, and any moderator.
 */
export const chatService = {
  async assertParticipant(taskId: string, userId: string, role: Role) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { job: { select: { clientId: true } } },
    });
    if (!task) throw AppError.notFound("Task not found");

    if (role === Role.MODERATOR) return task;
    if (role === Role.CLIENT && task.job.clientId === userId) return task;
    if (role === Role.STUDENT && task.assigneeId === userId) return task;

    throw AppError.forbidden("You are not a participant in this task's chat");
  },

  async list(taskId: string, userId: string, role: Role) {
    await this.assertParticipant(taskId, userId, role);
    return prisma.chatMessage.findMany({
      where: { taskId },
      orderBy: { createdAt: "asc" },
      include: { author: { select: { id: true, name: true, role: true } } },
    });
  },

  async post(
    taskId: string,
    userId: string,
    role: Role,
    body: string,
    attachment?: string
  ) {
    const task = await this.assertParticipant(taskId, userId, role);
    // Chat opens only once someone is suggested — except for a moderator.
    if (role !== Role.MODERATOR && !task.assigneeId) {
      throw AppError.badRequest(
        "The chat opens once a student has been suggested for this task"
      );
    }
    return prisma.chatMessage.create({
      data: { taskId, authorId: userId, fromRole: role, body, attachment },
      include: { author: { select: { id: true, name: true, role: true } } },
    });
  },
};

export type ChatService = typeof chatService;
