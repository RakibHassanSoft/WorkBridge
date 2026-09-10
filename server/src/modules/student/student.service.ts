import {
  KycKind,
  KycStatus,
  TaskStatus,
  TrialCheckStatus,
  TrialOutcome,
  PayStatus,
  DisputeParty,
  DisputeStatus,
} from "@prisma/client";
import prisma from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { aiService } from "@/modules/ai/ai.service";
import { genRef } from "@/utils/ref";
import { boardTaskInclude, KycDoc } from "./student.model";

/**
 * Student service — everything the student role does.
 * Rules enforced here:
 *  - A student must be VERIFIED (KYC) before applying to any trial.
 *  - Applying == doing the trial: one attempt per task, task must be live
 *    (MATCHING) with an APPROVED trial-check.
 *  - Points are NOT awarded at apply time; the +1/0/-1 resolves at selection
 *    (Phase 4, moderator) and delivery/sign-off (Phase 2, client).
 */
export const studentService = {
  async profile(studentId: string) {
    const user = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        studentProfile: true,
      },
    });
    if (!user) throw AppError.notFound("Student not found");
    return user;
  },

  updateProfile(
    studentId: string,
    data: {
      university?: string;
      discipline?: string;
      year?: string;
      city?: string;
      skills?: string[];
      bio?: string;
    }
  ) {
    return prisma.studentProfile.update({
      where: { userId: studentId },
      data,
    });
  },

  // ── KYC / verification ──

  async submitKyc(studentId: string, docs: KycDoc[]) {
    const existing = await prisma.kycSubmission.findFirst({
      where: { subjectId: studentId, status: { in: [KycStatus.PENDING, KycStatus.VERIFIED] } },
    });
    if (existing) {
      throw AppError.conflict(
        existing.status === KycStatus.VERIFIED
          ? "You are already verified"
          : "A verification is already pending review"
      );
    }
    // documents start unverified; a moderator clears them and the phone check.
    const documents = docs.map((d) => ({ ...d, ok: false }));
    return prisma.kycSubmission.create({
      data: {
        kind: KycKind.STUDENT,
        subjectId: studentId,
        status: KycStatus.PENDING,
        documents,
      },
    });
  },

  async myKyc(studentId: string) {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: studentId },
      select: { kycStatus: true },
    });
    const submission = await prisma.kycSubmission.findFirst({
      where: { subjectId: studentId },
      orderBy: { createdAt: "desc" },
    });
    return { status: profile?.kycStatus ?? KycStatus.PENDING, submission };
  },

  async isVerified(studentId: string): Promise<boolean> {
    const p = await prisma.studentProfile.findUnique({
      where: { userId: studentId },
      select: { kycStatus: true },
    });
    return p?.kycStatus === KycStatus.VERIFIED;
  },

  // ── Board / apply ──

  /** Live tasks the student can apply to, flagged with whether they already have. */
  async browse(studentId: string, filter: { sectorId?: string } = {}) {
    const tasks = await prisma.task.findMany({
      where: {
        status: TaskStatus.MATCHING,
        trialCheck: { status: TrialCheckStatus.APPROVED },
        ...(filter.sectorId ? { sectorId: filter.sectorId } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: boardTaskInclude,
    });
    const mine = await prisma.trialAttempt.findMany({
      where: { studentId, taskId: { in: tasks.map((t) => t.id) } },
      select: { taskId: true },
    });
    const applied = new Set(mine.map((m) => m.taskId));
    return tasks.map((t) => ({ ...t, applied: applied.has(t.id) }));
  },

  async taskDetail(taskId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: boardTaskInclude,
    });
    if (!task) throw AppError.notFound("Task not found");
    return task;
  },

  /** Apply by doing the trial. The AI scores the attempt. */
  async applyToTrial(
    studentId: string,
    taskId: string,
    input: { summary: string; minutesTaken: number }
  ) {
    if (!(await this.isVerified(studentId))) {
      throw AppError.forbidden(
        "Your account must be verified before you can do a trial"
      );
    }
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { trial: true, trialCheck: true },
    });
    if (!task) throw AppError.notFound("Task not found");
    if (task.status !== TaskStatus.MATCHING || task.trialCheck?.status !== TrialCheckStatus.APPROVED) {
      throw AppError.badRequest("This task is not open for applications");
    }
    if (!task.trial) throw AppError.badRequest("This task has no trial");

    const already = await prisma.trialAttempt.findUnique({
      where: { taskId_studentId: { taskId, studentId } },
    });
    if (already) throw AppError.conflict("You have already applied to this task");

    const evaluation = await aiService.evaluateAttempt({
      trialTitle: task.trial.title,
      trialBrief: task.trial.brief,
      trialMirrors: task.trial.mirrors ?? "",
      trialMinutes: task.trial.minutes,
      summary: input.summary,
      minutesTaken: input.minutesTaken,
    });

    return prisma.trialAttempt.create({
      data: {
        taskId,
        studentId,
        summary: input.summary,
        minutesTaken: input.minutesTaken,
        aiScore: evaluation.score,
        aiVerdict: evaluation.verdict,
        aiCoaching: evaluation.coaching,
        outcome: TrialOutcome.PENDING,
        points: 0,
      },
    });
  },

  // ── My trials & points ──

  listTrials(studentId: string) {
    return prisma.trialAttempt.findMany({
      where: { studentId },
      orderBy: { submittedAt: "desc" },
      include: { task: { select: { id: true, title: true, status: true } } },
    });
  },

  async points(studentId: string) {
    const entries = await prisma.pointEntry.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      include: { task: { select: { id: true, title: true } } },
    });
    const total = entries.reduce((a, e) => a + e.delta, 0);
    return { total, entries };
  },

  // ── Active task ──

  listActive(studentId: string) {
    return prisma.task.findMany({
      where: {
        assigneeId: studentId,
        status: { in: [TaskStatus.IN_PROGRESS, TaskStatus.REVISION, TaskStatus.IN_REVIEW] },
      },
      orderBy: { updatedAt: "desc" },
      include: { job: { select: { ref: true, brief: true } }, sector: true, payment: true },
    });
  },

  async ownedActiveTask(studentId: string, taskId: string) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw AppError.notFound("Task not found");
    if (task.assigneeId !== studentId) {
      throw AppError.forbidden("This task is not assigned to you");
    }
    return task;
  },

  async reportProgress(studentId: string, taskId: string, progress: number) {
    await this.ownedActiveTask(studentId, taskId);
    return prisma.task.update({
      where: { id: taskId },
      data: { progress: Math.max(0, Math.min(100, Math.round(progress))) },
    });
  },

  /** Submit the finished main task; moves it to review for scoring + sign-off. */
  async submitWork(studentId: string, taskId: string, note: string) {
    const task = await this.ownedActiveTask(studentId, taskId);
    if (task.status !== TaskStatus.IN_PROGRESS && task.status !== TaskStatus.REVISION) {
      throw AppError.badRequest("This task is not in a state you can submit");
    }
    return prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.IN_REVIEW,
        progress: 100,
        submissionNote: note,
        submittedAt: new Date(),
      },
    });
  },

  // ── Record & earnings ──

  listRecord(studentId: string) {
    return prisma.task.findMany({
      where: { assigneeId: studentId, status: TaskStatus.APPROVED },
      orderBy: { updatedAt: "desc" },
      include: {
        sector: true,
        evaluation: true,
        job: { select: { ref: true, clientId: true } },
      },
    });
  },

  async earnings(studentId: string) {
    const released = await prisma.payment.findMany({
      where: { status: PayStatus.RELEASED, task: { assigneeId: studentId } },
      include: { task: { select: { id: true, title: true } } },
      orderBy: { updatedAt: "desc" },
    });
    const total = released.reduce((a, p) => a + p.amount, 0);
    return { total, payments: released };
  },

  // ── Dispute (student side) ──

  async raiseDispute(
    studentId: string,
    taskId: string,
    input: { claim: string; amount: number; evidence?: string[] }
  ) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { dispute: true },
    });
    if (!task) throw AppError.notFound("Task not found");
    if (task.assigneeId !== studentId) {
      throw AppError.forbidden("You can only dispute a task assigned to you");
    }
    if (task.dispute) throw AppError.conflict("A dispute already exists for this task");
    return prisma.dispute.create({
      data: {
        ref: genRef("DSP"),
        taskId,
        raisedById: studentId,
        raisedByRole: DisputeParty.STUDENT,
        status: DisputeStatus.OPEN,
        amount: input.amount,
        claim: input.claim,
        evidence: input.evidence ?? [],
      },
    });
  },
};

export type StudentService = typeof studentService;
