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
import { sectorSeed } from "@/modules/ai/ai.engine";
import { env } from "@/config/env";
import { initSession, sslcommerzEnabled } from "@/modules/payment/sslcommerz";
import { taskService } from "@/modules/task/task.service";
import { genRef } from "@/utils/ref";
import { toTaskLevel, jobDetailInclude } from "./client.model";
import { Attachment, summarizeAttachments, stripBinary } from "@/modules/ai/attachments";

/**
 * Client service — everything the client role does, with the flow rules
 * enforced here (not just in the UI):
 *   post brief -> stored at once, no approval step -> AI builds the task and a
 *   small same-feature trial -> client approves the trial (or asks for changes,
 *   and the AI rebuilds it) -> task goes live on the board -> students do the
 *   trial, the AI judges their files and shortlists 90%+ -> moderator selects
 *   (escrow must be funded by then) -> ... -> client signs off -> escrow releases.
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
    input: { brief: string; budget?: number; title?: string; attachments?: Attachment[] }
  ) {
    // If the client attached documents, feed their text to the AI so the scope
    // reflects what is in the files (the AI organises here; it does not price-gate).
    const files = summarizeAttachments(input.attachments);
    const briefForScope = files.text
      ? `${input.brief}\n\n--- Attached documents ---\n${files.text}`
      : input.brief;
    const scope = await aiService.scope(briefForScope, { budget: input.budget });
    const postedFee =
      input.budget && input.budget > 0 ? input.budget : scope.suggestedFee;

    // Reference data: make sure the Sector row exists before we connect the job
    // and task to it. On a database that was never seeded there are no sectors,
    // and a plain `connect` would throw P2025 ("Record not found"). Upsert keeps
    // posting working with no seed, and is a no-op once the sector exists.
    const sector = sectorSeed(scope.sectorId);
    await prisma.sector.upsert({
      where: { id: sector.id },
      update: {},
      create: sector,
    });

    const job = await prisma.job.create({
      data: {
        ref: genRef("BD"),
        client: { connect: { id: clientId } },
        title: input.title?.trim() || scope.title,
        brief: input.brief,
        sector: { connect: { id: scope.sectorId } },
        budget: postedFee,
        // Stored immediately — no moderator approval step. SCOPING now means
        // "the AI's trial is waiting for the client's check".
        status: JobStatus.SCOPING,
        scopeApproved: true,
        aiSummary: scope.summary,
        aiComplexity: scope.complexity,
        aiConfidence: scope.confidence,
        aiEstHours: scope.estHours,
        aiSuggestedFee: scope.suggestedFee,
        aiRisks: scope.risks,
        aiSkills: scope.skills,
        attachments: input.attachments
          ? (stripBinary(input.attachments) as unknown as Prisma.InputJsonValue)
          : undefined,
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

  async listJobs(clientId: string) {
    // Same detail as a single job: the workspace needs each task's trial (to
    // check it) and its evaluation (to sign off), not just payment + check.
    const jobs = await prisma.job.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      include: jobDetailInclude,
    });
    return this.withTrialStats(jobs);
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
    return (await this.withTrialStats([job]))[0];
  },

  /**
   * Add `trialStats` to every task: how many students did the trial and how
   * many the AI shortlisted (90%+). Counts only — who they are stays with the
   * moderator until one is selected.
   */
  async withTrialStats<J extends { tasks: { id: string }[] }>(jobs: J[]) {
    const ids = jobs.flatMap((j) => j.tasks.map((t) => t.id));
    const rows = ids.length
      ? await prisma.trialAttempt.groupBy({ by: ["taskId", "outcome"], where: { taskId: { in: ids } }, _count: { _all: true } })
      : [];
    const stats = new Map<string, { applicants: number; shortlisted: number }>();
    for (const r of rows as unknown as { taskId: string; outcome: TrialOutcome; _count: { _all: number } }[]) {
      const s = stats.get(r.taskId) ?? { applicants: 0, shortlisted: 0 };
      s.applicants += r._count._all;
      if (r.outcome === TrialOutcome.SHORTLISTED || r.outcome === TrialOutcome.SELECTED) s.shortlisted += r._count._all;
      stats.set(r.taskId, s);
    }
    return jobs.map((j) => ({
      ...j,
      tasks: j.tasks.map((t) => ({ ...t, trialStats: stats.get(t.id) ?? { applicants: 0, shortlisted: 0 } })),
    }));
  },

  /**
   * The client's trial check. Approve -> the task goes live on the board.
   * Ask for changes -> the AI rebuilds the trial with the note as a new
   * requirement and hands it back for another check.
   */
  async reviewTrial(
    clientId: string,
    taskId: string,
    input: { decision: "approve" | "changes"; note?: string }
  ) {
    const task = await this.ownedTask(clientId, taskId, { job: true, trial: true, trialCheck: true, sector: true });
    const t = task as unknown as {
      status: TaskStatus;
      hours: number;
      sectorId: string | null;
      job: { brief: string; attachments: unknown };
      sector: { name: string } | null;
      trial: { title: string; brief: string; acceptance: string[]; revision: number } | null;
      trialCheck: { status: TrialCheckStatus } | null;
    };
    if (!t.trialCheck) throw AppError.notFound("No trial check for this task");
    if (t.trialCheck.status === TrialCheckStatus.APPROVED) {
      throw AppError.conflict("The trial has already been approved");
    }
    if (t.status === TaskStatus.CANCELLED) throw AppError.conflict("This task was cancelled");

    if (input.decision === "approve") {
      const updated = await prisma.trialCheck.update({
        where: { taskId },
        data: { status: TrialCheckStatus.APPROVED, decidedAt: new Date() },
      });
      // The client's approval is the only gate: the task is now live on the board.
      await taskService.maybeActivate(taskId);
      return { ...updated, live: true };
    }

    const note = (input.note ?? "").trim();
    if (note.length < 3) throw AppError.badRequest("Say what the trial should test instead");
    if (!t.trial) throw AppError.notFound("This task has no trial");

    const docs = summarizeAttachments(t.job.attachments as Attachment[] | null);
    const rebuilt = await aiService.rebuildTrial({
      brief: docs.text ? `${t.job.brief}\n\n--- Attached documents ---\n${docs.text}` : t.job.brief,
      sectorId: t.sectorId ?? "admin",
      sectorName: t.sector?.name,
      hours: t.hours,
      current: { title: t.trial.title, brief: t.trial.brief, requirements: t.trial.acceptance },
      note,
    });

    const [trial, check] = await prisma.$transaction([
      prisma.trial.update({
        where: { taskId },
        data: {
          title: rebuilt.title,
          brief: rebuilt.brief,
          minutes: rebuilt.minutes,
          mirrors: rebuilt.mirrors,
          acceptance: rebuilt.acceptance,
          aiNote: `Rebuilt from the client's note: ${note}`,
          revision: { increment: 1 },
        },
      }),
      // Back to the client for another look — the new trial needs their approval.
      prisma.trialCheck.update({
        where: { taskId },
        data: { status: TrialCheckStatus.AWAITING_CLIENT, clientNote: note, decidedAt: new Date() },
      }),
    ]);
    return { ...check, trial, rebuilt: true };
  },

  /**
   * Fund the escrow. The AI's fair-price verdict is computed for information
   * only and returned to the client — funding is NEVER blocked on price.
   */
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

    // Informational only: whatever the verdict, the deposit is allowed to proceed.
    const price = aiService.checkPrice(
      task.fee,
      task.hours,
      (task as { sectorId: string | null }).sectorId ?? "admin"
    );

    let methodLabel = "Escrow deposit";
    if (input.paymentMethodId) {
      const pm = await prisma.paymentMethod.findFirst({
        where: { id: input.paymentMethodId, clientId },
      });
      if (!pm) throw AppError.notFound("Payment method not found");
      methodLabel = pm.label;
    }

    // With SSLCommerz configured, open a gateway session and send the client
    // there to pay. The escrow only becomes HELD once the gateway confirms the
    // transaction (via the success/IPN callback -> paymentService.confirm).
    if (sslcommerzEnabled()) {
      const client = await prisma.user.findUnique({
        where: { id: clientId },
        select: { name: true, email: true, phone: true },
      });
      const tranId = genRef("TXN");
      await prisma.payment.update({ where: { taskId }, data: { tranId, method: methodLabel } });

      const gatewayUrl = await initSession({
        amount: task.fee,
        tranId,
        productName: task.title,
        customer: {
          name: client?.name ?? "Client",
          email: client?.email ?? "client@bdfreshers.bd",
          phone: client?.phone,
        },
        successUrl: `${env.apiUrl}/payments/sslcommerz/success`,
        failUrl: `${env.apiUrl}/payments/sslcommerz/fail`,
        cancelUrl: `${env.apiUrl}/payments/sslcommerz/cancel`,
        ipnUrl: `${env.apiUrl}/payments/sslcommerz/ipn`,
      });
      if (!gatewayUrl) {
        throw AppError.badRequest("Could not start the payment session. Please try again.");
      }
      return { gatewayUrl, fairPrice: price };
    }

    // No gateway configured (local dev): hold the escrow immediately.
    const updated = await prisma.payment.update({
      where: { taskId },
      data: {
        status: PayStatus.HELD,
        method: methodLabel,
        note: "Held in escrow until sign-off",
      },
    });

    return { payment: updated, fairPrice: price, gatewayUrl: null };
  },

  /**
   * Modify a posted problem — only before a student is selected (task OPEN or
   * MATCHING). The fee cannot change once the escrow is funded (HELD).
   */
  async updateTask(
    clientId: string,
    taskId: string,
    input: { title?: string; brief?: string; budget?: number; hours?: number }
  ) {
    const task = await this.ownedTask(clientId, taskId, { job: true, payment: true });
    const status = (task as { status: TaskStatus }).status;
    if (status !== TaskStatus.OPEN && status !== TaskStatus.MATCHING) {
      throw AppError.conflict("This task can only be edited before a student is selected");
    }
    const payment = (task as { payment: { status: PayStatus } | null }).payment;
    const feeChanging = input.budget != null && input.budget !== task.fee;
    if (feeChanging && payment?.status === PayStatus.HELD) {
      throw AppError.conflict("The fee cannot change after the escrow is funded — refund it first, or cancel and repost");
    }

    const taskData: Prisma.TaskUpdateInput = {};
    const jobData: Prisma.JobUpdateInput = {};
    if (input.title?.trim()) {
      taskData.title = input.title.trim();
      jobData.title = input.title.trim();
    }
    if (input.brief?.trim()) jobData.brief = input.brief.trim();
    if (input.hours != null) taskData.hours = input.hours;
    if (feeChanging) {
      taskData.fee = input.budget!;
      jobData.budget = input.budget!;
    }

    const ops: Prisma.PrismaPromise<unknown>[] = [];
    if (Object.keys(taskData).length) ops.push(prisma.task.update({ where: { id: taskId }, data: taskData }));
    if (Object.keys(jobData).length) ops.push(prisma.job.update({ where: { id: task.jobId }, data: jobData }));
    if (feeChanging && payment?.status === PayStatus.AWAITING) {
      ops.push(prisma.payment.update({ where: { taskId }, data: { amount: input.budget! } }));
    }
    if (!ops.length) throw AppError.badRequest("Nothing to update");

    await prisma.$transaction(ops);
    return this.getJob(clientId, task.jobId);
  },

  /**
   * Cancel (soft-delete) a task the client owns. Sets the task and its job to
   * CANCELLED and refunds any held escrow — history and attempts are preserved.
   * Not allowed once a student is working on it (open a dispute instead) or
   * after delivery.
   */
  async cancelTask(clientId: string, taskId: string) {
    const task = await this.ownedTask(clientId, taskId, { job: true, payment: true });
    const status = (task as { status: TaskStatus }).status;
    if (status === TaskStatus.CANCELLED) throw AppError.conflict("This task is already cancelled");
    if (status === TaskStatus.APPROVED) throw AppError.conflict("A delivered task cannot be cancelled");
    if (
      status === TaskStatus.IN_PROGRESS ||
      status === TaskStatus.IN_REVIEW ||
      status === TaskStatus.REVISION
    ) {
      throw AppError.conflict("A student is working on this task — open a dispute instead of cancelling");
    }

    const payment = (task as { payment: { status: PayStatus } | null }).payment;
    const ops: Prisma.PrismaPromise<unknown>[] = [
      prisma.task.update({ where: { id: taskId }, data: { status: TaskStatus.CANCELLED } }),
      prisma.job.update({ where: { id: task.jobId }, data: { status: JobStatus.CANCELLED } }),
    ];
    if (payment) {
      ops.push(
        prisma.payment.update({
          where: { taskId },
          data: {
            status: payment.status === PayStatus.HELD ? PayStatus.REFUNDED : PayStatus.FAILED,
            note: "Task cancelled by the client",
          },
        })
      );
    }
    await prisma.$transaction(ops);
    return { cancelled: true };
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
