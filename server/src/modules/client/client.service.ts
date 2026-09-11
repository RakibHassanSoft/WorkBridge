import {
  JobStatus,
  PayStatus,
  TaskStatus,
  TrialCheckStatus,
  TrialOutcome,
  DisputeParty,
  DisputeStatus,
  Prisma,
} from "@prisma/client";
import prisma from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { aiService } from "@/modules/ai/ai.service";
import { taskService } from "@/modules/task/task.service";
import { genRef } from "@/utils/ref";
import { toTaskLevel, jobDetailInclude } from "./client.model";

/**
 * Client service — everything the client role does, with the flow rules
 * enforced here (not just in the UI):
 *   post brief -> AI scope + trial -> (client checks trial) + (deposit escrow)
 *   -> task goes live -> ... -> client signs off -> escrow releases.
 * Escrow is released ONLY on an accept sign-off; a revision keeps it held.
 */
export const clientService = {
  /** Load a task the client owns, or throw 404/403. */
  async ownedTask(clientId: string, taskId: string, include?: Prisma.TaskInclude) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: include ?? {
        job: true,
        payment: true,
        trialCheck: true,
        evaluation: true,
      },
    });
    if (!task) throw AppError.notFound("Task not found");
    const clientOfTask = (task as { job: { clientId: string } }).job.clientId;
    if (clientOfTask !== clientId) {
      throw AppError.forbidden("This task belongs to another client");
    }
    return task;
  },

  /** Post a problem: run the AI scope, persist job + task + trial + trial-check + (unfunded) payment. */
  async postJob(
    clientId: string,
    input: { brief: string; budget?: number; title?: string }
  ) {
    const scope = await aiService.scope(input.brief, { budget: input.budget });
    const postedFee =
      input.budget && input.budget > 0 ? input.budget : scope.suggestedFee;

    const job = await prisma.job.create({
      data: {
        ref: genRef("WB"),
        client: { connect: { id: clientId } },
        title: input.title?.trim() || scope.title,
        brief: input.brief,
        sector: { connect: { id: scope.sectorId } },
        budget: postedFee,
        status: JobStatus.SCOPING,
        aiSummary: scope.summary,
        aiComplexity: scope.complexity,
        aiConfidence: scope.confidence,
        aiEstHours: scope.estHours,
        aiSuggestedFee: scope.suggestedFee,
        aiRisks: scope.risks,
        aiSkills: scope.skills,
        tasks: {
          create: {
            title: scope.title,
            desc: scope.desc,
            sector: { connect: { id: scope.sectorId } },
            fee: postedFee,
            hours: scope.estHours,
            level: toTaskLevel(scope.level),
            skills: scope.skills,
            acceptance: scope.acceptance,
            status: TaskStatus.OPEN,
            trial: {
              create: {
                title: scope.trial.title,
                brief: scope.trial.brief,
                minutes: scope.trial.minutes,
                mirrors: scope.trial.mirrors,
                acceptance: scope.trial.acceptance,
                aiNote: scope.trial.mirrors,
              },
            },
            trialCheck: { create: { status: TrialCheckStatus.AWAITING_CLIENT } },
            payment: {
              create: {
                amount: postedFee,
                status: PayStatus.AWAITING,
                client: { connect: { id: clientId } },
                note: "Awaiting deposit",
              },
            },
          },
        },
      },
      include: jobDetailInclude,
    });

    return { job, price: scope.price };
  },

  listJobs(clientId: string) {
    // Same detail as a single job: the workspace needs each task's trial (to
    // check it) and its evaluation (to sign off), not just payment + check.
    return prisma.job.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      include: jobDetailInclude,
    });
  },

  async getJob(clientId: string, jobId: string) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: jobDetailInclude,
    });
    if (!job) throw AppError.notFound("Job not found");
    if (job.clientId !== clientId) {
      throw AppError.forbidden("This job belongs to another client");
    }
    return job;
  },

  /** The client's trial check: the AI-built trial must mirror their real work. */
  async reviewTrial(
    clientId: string,
    taskId: string,
    input: { decision: "approve" | "changes"; note?: string }
  ) {
    const task = await this.ownedTask(clientId, taskId);
    const check = (task as { trialCheck: { status: TrialCheckStatus } | null })
      .trialCheck;
    if (!check) throw AppError.notFound("No trial check for this task");
    if (check.status === TrialCheckStatus.APPROVED) {
      throw AppError.conflict("The trial has already been approved");
    }

    if (input.decision === "approve") {
      const updated = await prisma.trialCheck.update({
        where: { taskId },
        data: { status: TrialCheckStatus.APPROVED, decidedAt: new Date() },
      });
      // May now be live if the moderator has released the scope and it's funded.
      await taskService.maybeActivate(taskId);
      return updated;
    }

    return prisma.trialCheck.update({
      where: { taskId },
      data: { status: TrialCheckStatus.CHANGES_ASKED, clientNote: input.note },
    });
  },

  /** Fund the escrow. Blocked if the fee fails the fair-price floor. */
  async depositEscrow(
    clientId: string,
    taskId: string,
    input: { paymentMethodId?: string }
  ) {
    const task = await this.ownedTask(clientId, taskId);
    const payment = (task as { payment: { status: PayStatus } | null }).payment;
    if (!payment) throw AppError.notFound("No payment for this task");
    if (payment.status !== PayStatus.AWAITING) {
      throw AppError.conflict("This task's escrow is not awaiting a deposit");
    }

    const price = aiService.checkPrice(
      task.fee,
      task.hours,
      (task as { sectorId: string | null }).sectorId ?? "admin"
    );
    if (price.level === "blocked") {
      throw AppError.badRequest(
        `Cannot fund an underpriced task. ${price.message}`
      );
    }

    let methodLabel = "Escrow deposit";
    if (input.paymentMethodId) {
      const pm = await prisma.paymentMethod.findFirst({
        where: { id: input.paymentMethodId, clientId },
      });
      if (!pm) throw AppError.notFound("Payment method not found");
      methodLabel = pm.label;
    }

    const updated = await prisma.payment.update({
      where: { taskId },
      data: {
        status: PayStatus.HELD,
        method: methodLabel,
        note: "Held in escrow until sign-off",
      },
    });

    // May now be live if the moderator has released the scope and the trial is approved.
    await taskService.maybeActivate(taskId);

    return { payment: updated, fairPrice: price };
  },

  /** Accept the delivered work (release escrow) or ask for a revision (hold it). */
  async signOff(
    clientId: string,
    taskId: string,
    input: { decision: "accept" | "revision"; note?: string }
  ) {
    const task = await this.ownedTask(clientId, taskId, {
      job: true,
      payment: true,
      evaluation: true,
    });
    const evaluation = (task as { evaluation: { id: string } | null }).evaluation;
    const payment = (task as { payment: { status: PayStatus } | null }).payment;

    if (!evaluation) {
      throw AppError.badRequest("There is nothing to sign off yet");
    }
    if (!payment || payment.status !== PayStatus.HELD) {
      throw AppError.conflict("No escrow is held for this task");
    }

    if (input.decision === "revision") {
      await prisma.$transaction([
        prisma.task.update({
          where: { id: taskId },
          data: { status: TaskStatus.REVISION },
        }),
        prisma.evaluation.update({
          where: { taskId },
          data: { clientSignoff: false, clientNote: input.note },
        }),
      ]);
      return { released: false, message: "Revision requested; escrow stays held" };
    }

    // accept: release escrow, mark delivered, credit the selected student 0.
    const assigneeId = (task as { assigneeId: string | null }).assigneeId;

    const ops: Prisma.PrismaPromise<unknown>[] = [
      prisma.evaluation.update({
        where: { taskId },
        data: { clientSignoff: true, clientNote: input.note },
      }),
      prisma.payment.update({
        where: { taskId },
        data: { status: PayStatus.RELEASED, note: "Released on client sign-off" },
      }),
      prisma.task.update({
        where: { id: taskId },
        data: { status: TaskStatus.APPROVED },
      }),
      prisma.job.update({
        where: { id: task.jobId },
        data: { status: JobStatus.DELIVERED },
      }),
    ];

    if (assigneeId) {
      ops.push(
        prisma.trialAttempt.updateMany({
          where: { taskId, studentId: assigneeId, outcome: TrialOutcome.SELECTED },
          data: {
            points: 0,
            pointsReason: "Selected and delivered the main task — 0",
          },
        }),
        prisma.pointEntry.create({
          data: {
            studentId: assigneeId,
            taskId,
            delta: 0,
            reason: "Selected and delivered the main task — 0",
          },
        })
      );
    }

    await prisma.$transaction(ops);
    return { released: true, message: "Work accepted; escrow released to the student" };
  },

  async raiseDispute(
    clientId: string,
    taskId: string,
    input: { claim: string; amount: number; evidence?: string[] }
  ) {
    const task = await this.ownedTask(clientId, taskId, { job: true, dispute: true });
    if ((task as { dispute: unknown }).dispute) {
      throw AppError.conflict("A dispute already exists for this task");
    }
    return prisma.dispute.create({
      data: {
        ref: genRef("DSP"),
        taskId,
        raisedById: clientId,
        raisedByRole: DisputeParty.CLIENT,
        status: DisputeStatus.OPEN,
        amount: input.amount,
        claim: input.claim,
        evidence: input.evidence ?? [],
      },
    });
  },

  listPayments(clientId: string) {
    return prisma.payment.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      include: { task: { select: { id: true, title: true, status: true } } },
    });
  },

  listPaymentMethods(clientId: string) {
    return prisma.paymentMethod.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
    });
  },

  addPaymentMethod(
    clientId: string,
    input: { kind: string; label: string; isDefault?: boolean }
  ) {
    return prisma.paymentMethod.create({
      data: {
        clientId,
        kind: input.kind,
        label: input.label,
        isDefault: input.isDefault ?? false,
      },
    });
  },
};

export type ClientService = typeof clientService;
