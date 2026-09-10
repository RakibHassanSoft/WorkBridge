import {
  JobStatus,
  TaskStatus,
  PayStatus,
  TrialOutcome,
  KycStatus,
  DisputeStatus,
  TicketStatus,
  Role,
  Prisma,
} from "@prisma/client";
import prisma from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { taskService } from "@/modules/task/task.service";
import { RATE_FLOOR } from "@/modules/ai/ai.engine";

/**
 * Moderator service — the human gate. Every AI decision is a draft until a
 * moderator releases it, and the points rule resolves here at selection:
 *   tried, not selected  -> +1
 *   selected             ->  0 (provisional; 0 on delivery, -1 on failure)
 */
export const moderatorService = {
  // ── Scope review ──
  listScopes() {
    return prisma.job.findMany({
      where: { status: JobStatus.SCOPING, scopeApproved: false },
      orderBy: { createdAt: "asc" },
      include: {
        client: { select: { id: true, name: true } },
        sector: true,
        tasks: { include: { trial: true, payment: true, trialCheck: true } },
      },
    });
  },

  async approveScope(
    jobId: string,
    input: { fee?: number; hours?: number; summary?: string; note?: string }
  ) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { tasks: true },
    });
    if (!job) throw AppError.notFound("Job not found");
    if (job.scopeApproved) throw AppError.conflict("Scope already released");

    const ops: Prisma.PrismaPromise<unknown>[] = [
      prisma.job.update({
        where: { id: jobId },
        data: {
          scopeApproved: true,
          ...(input.summary ? { aiSummary: input.summary } : {}),
          ...(input.hours ? { aiEstHours: input.hours } : {}),
          ...(input.fee ? { aiSuggestedFee: input.fee, budget: input.fee } : {}),
        },
      }),
    ];
    // A re-price/re-scope edits the single task's numbers too.
    if (input.fee || input.hours) {
      const task = job.tasks[0];
      if (task) {
        ops.push(
          prisma.task.update({
            where: { id: task.id },
            data: {
              ...(input.fee ? { fee: input.fee } : {}),
              ...(input.hours ? { hours: input.hours } : {}),
            },
          }),
          ...(input.fee
            ? [prisma.payment.update({ where: { taskId: task.id }, data: { amount: input.fee } })]
            : [])
        );
      }
    }
    await prisma.$transaction(ops);

    // Releasing the scope may be the last gate before the task goes live.
    for (const task of job.tasks) await taskService.maybeActivate(task.id);
    return prisma.job.findUnique({ where: { id: jobId }, include: { tasks: true } });
  },

  async rejectScope(jobId: string, reason: string) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { tasks: { include: { payment: true } } },
    });
    if (!job) throw AppError.notFound("Job not found");

    const ops: Prisma.PrismaPromise<unknown>[] = [
      prisma.job.update({ where: { id: jobId }, data: { status: JobStatus.CANCELLED } }),
    ];
    for (const task of job.tasks) {
      ops.push(
        prisma.task.update({ where: { id: task.id }, data: { status: TaskStatus.CANCELLED } })
      );
      if (task.payment) {
        ops.push(
          prisma.payment.update({
            where: { taskId: task.id },
            data: {
              status:
                task.payment.status === PayStatus.HELD
                  ? PayStatus.REFUNDED
                  : PayStatus.FAILED,
              note: `Scope rejected: ${reason}`,
            },
          })
        );
      }
    }
    await prisma.$transaction(ops);
    return { rejected: true, reason };
  },

  // ── Select the student (points resolve here) ──
  listSelectRounds() {
    return prisma.task.findMany({
      where: { status: TaskStatus.MATCHING, attempts: { some: {} } },
      orderBy: { updatedAt: "desc" },
      include: {
        job: { include: { client: { select: { id: true, name: true } } } },
        trial: true,
        attempts: {
          orderBy: { aiScore: "desc" },
          include: { student: { select: { id: true, name: true } } },
        },
      },
    });
  },

  async selectStudent(taskId: string, studentId: string, reason: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { attempts: true },
    });
    if (!task) throw AppError.notFound("Task not found");
    if (task.status !== TaskStatus.MATCHING) {
      throw AppError.conflict("This task is not awaiting selection");
    }
    const chosen = task.attempts.find((a) => a.studentId === studentId);
    if (!chosen) throw AppError.badRequest("That student did not do this trial");

    const others = task.attempts.filter((a) => a.studentId !== studentId);

    const ops: Prisma.PrismaPromise<unknown>[] = [
      prisma.task.update({
        where: { id: taskId },
        data: { assigneeId: studentId, status: TaskStatus.IN_PROGRESS },
      }),
      prisma.job.update({ where: { id: task.jobId }, data: { status: JobStatus.ACTIVE } }),
      // selected: 0 (provisional) — chat with the client opens now
      prisma.trialAttempt.update({
        where: { id: chosen.id },
        data: {
          outcome: TrialOutcome.SELECTED,
          rank: 1,
          points: 0,
          pointsReason: "Selected — main task in progress (0 until delivered)",
        },
      }),
      prisma.pointEntry.create({
        data: {
          studentId,
          taskId,
          delta: 0,
          reason: "Selected — main task in progress",
        },
      }),
    ];

    // everyone else who did the trial: +1
    for (const a of others) {
      ops.push(
        prisma.trialAttempt.update({
          where: { id: a.id },
          data: {
            outcome: TrialOutcome.NOT_SHORTLISTED,
            points: 1,
            pointsReason: "Did the trial, was not selected — +1",
          },
        }),
        prisma.pointEntry.create({
          data: {
            studentId: a.studentId,
            taskId,
            delta: 1,
            reason: "Did the trial, was not selected — +1",
          },
        })
      );
    }

    await prisma.$transaction(ops);
    return { taskId, selected: studentId, reason, creditedOthers: others.length };
  },

  // ── Score the delivered work (before client sign-off) ──
  listReviews() {
    return prisma.task.findMany({
      where: { status: TaskStatus.IN_REVIEW, evaluation: null },
      orderBy: { submittedAt: "asc" },
      include: {
        assignee: { select: { id: true, name: true } },
        trial: true,
        job: { select: { ref: true, clientId: true } },
      },
    });
  },

  async scoreWork(
    reviewerId: string,
    taskId: string,
    input: { scores: { dim: string; score: number; max: number }[]; note?: string }
  ) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw AppError.notFound("Task not found");
    if (!task.assigneeId) throw AppError.badRequest("No student is assigned to this task");
    if (task.status !== TaskStatus.IN_REVIEW) {
      throw AppError.conflict("This task is not awaiting scoring");
    }
    return prisma.evaluation.upsert({
      where: { taskId },
      create: {
        taskId,
        studentId: task.assigneeId,
        reviewerId,
        scores: input.scores,
        reviewerNote: input.note,
      },
      update: { scores: input.scores, reviewerNote: input.note, reviewerId },
    });
  },

  // ── KYC / verify students ──
  listKyc() {
    return prisma.kycSubmission.findMany({
      where: { status: KycStatus.PENDING },
      orderBy: { createdAt: "asc" },
      include: { subject: { select: { id: true, name: true, email: true } } },
    });
  },

  async decideKyc(
    submissionId: string,
    input: { decision: "approve" | "reject" | "resubmit"; note?: string }
  ) {
    const sub = await prisma.kycSubmission.findUnique({ where: { id: submissionId } });
    if (!sub) throw AppError.notFound("Submission not found");

    if (input.decision === "approve") {
      const docs = Array.isArray(sub.documents)
        ? (sub.documents as { label: string; detail: string }[]).map((d) => ({ ...d, ok: true }))
        : sub.documents;
      await prisma.$transaction([
        prisma.kycSubmission.update({
          where: { id: submissionId },
          data: { status: KycStatus.VERIFIED, documents: docs as Prisma.InputJsonValue, note: input.note },
        }),
        prisma.studentProfile.update({
          where: { userId: sub.subjectId },
          data: { kycStatus: KycStatus.VERIFIED },
        }),
      ]);
      return { status: KycStatus.VERIFIED };
    }

    const status = input.decision === "reject" ? KycStatus.REJECTED : KycStatus.RESUBMIT;
    await prisma.$transaction([
      prisma.kycSubmission.update({
        where: { id: submissionId },
        data: { status, note: input.note },
      }),
      prisma.studentProfile.update({
        where: { userId: sub.subjectId },
        data: { kycStatus: input.decision === "reject" ? KycStatus.REJECTED : KycStatus.PENDING },
      }),
    ]);
    return { status };
  },

  // ── Payments ──
  listPayments() {
    return prisma.payment.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        task: { select: { id: true, title: true, status: true } },
        client: { select: { id: true, name: true } },
      },
    });
  },

  async refund(taskId: string, reason: string) {
    const payment = await prisma.payment.findUnique({ where: { taskId } });
    if (!payment) throw AppError.notFound("No payment for this task");
    if (payment.status !== PayStatus.HELD) {
      throw AppError.conflict("Only held escrow can be refunded");
    }
    const [updated] = await prisma.$transaction([
      prisma.payment.update({
        where: { taskId },
        data: { status: PayStatus.REFUNDED, note: `Refunded: ${reason}` },
      }),
      prisma.task.update({ where: { id: taskId }, data: { status: TaskStatus.CANCELLED } }),
    ]);
    return updated;
  },

  // ── Disputes ──
  listDisputes(status?: DisputeStatus) {
    return prisma.dispute.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: "desc" },
      include: {
        task: { select: { id: true, title: true, assigneeId: true } },
        raisedBy: { select: { id: true, name: true } },
      },
    });
  },

  /**
   * Rule a dispute. The ruling is written onto the dispute (both-record
   * semantics) and moves the held escrow: refund the client, release to the
   * student, or split. A client-refund means the student failed to deliver, so
   * their point resolves to -1.
   */
  async ruleDispute(
    disputeId: string,
    input: { outcome: "client" | "student" | "split"; resolution: string }
  ) {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { task: true },
    });
    if (!dispute) throw AppError.notFound("Dispute not found");
    if (dispute.status === DisputeStatus.RESOLVED) {
      throw AppError.conflict("Dispute already resolved");
    }

    const payStatus =
      input.outcome === "client" ? PayStatus.REFUNDED : PayStatus.RELEASED;
    const outcomeText =
      input.outcome === "client"
        ? "Refunded to the client"
        : input.outcome === "student"
          ? "Released to the student"
          : "Split for partial delivery";

    const ops: Prisma.PrismaPromise<unknown>[] = [
      prisma.dispute.update({
        where: { id: disputeId },
        data: {
          status: DisputeStatus.RESOLVED,
          outcome: outcomeText,
          resolution: input.resolution,
        },
      }),
      prisma.payment.update({
        where: { taskId: dispute.taskId },
        data: { status: payStatus, note: `Dispute ${dispute.ref}: ${outcomeText}` },
      }),
    ];

    const assigneeId = dispute.task.assigneeId;
    if (assigneeId && input.outcome === "client") {
      // student did not deliver -> -1
      ops.push(
        prisma.trialAttempt.updateMany({
          where: { taskId: dispute.taskId, studentId: assigneeId, outcome: TrialOutcome.SELECTED },
          data: { points: -1, pointsReason: "Selected but did not deliver — -1" },
        }),
        prisma.pointEntry.create({
          data: {
            studentId: assigneeId,
            taskId: dispute.taskId,
            delta: -1,
            reason: "Selected but did not deliver the main task — -1",
          },
        })
      );
    }

    await prisma.$transaction(ops);
    return { resolved: true, outcome: outcomeText };
  },

  // ── Support ──
  listTickets(status?: TicketStatus) {
    return prisma.supportTicket.findMany({
      where: status ? { status } : {},
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
      include: { from: { select: { id: true, name: true, role: true } } },
    });
  },

  async replyTicket(ticketId: string, reply: string) {
    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw AppError.notFound("Ticket not found");
    return prisma.supportTicket.update({
      where: { id: ticketId },
      data: { reply, status: TicketStatus.ANSWERED },
    });
  },

  // ── Directory ──
  listUsers(filter: { role?: Role } = {}) {
    return prisma.user.findMany({
      where: filter.role ? { role: filter.role } : {},
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        clientProfile: true,
        studentProfile: true,
      },
    });
  },

  setUserActive(userId: string, isActive: boolean) {
    return prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: { id: true, name: true, isActive: true },
    });
  },

  // ── Platform controls ──
  controls() {
    return {
      rateFloors: RATE_FLOOR,
      rules: [
        { key: "fairPriceFloor", label: "Fair-price floor (per sector)", locked: true },
        { key: "escrowReleaseOnSignoff", label: "Escrow releases only on client sign-off", locked: true },
        { key: "verifyBeforeTrial", label: "Students must be verified before a trial", locked: true },
        { key: "trialToApply", label: "Applying means doing the trial", locked: true },
      ],
    };
  },
};

export type ModeratorService = typeof moderatorService;
