import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import {
  Role,
  JobStatus,
  TaskStatus,
  TaskLevel,
  PayStatus,
  TrialCheckStatus,
  TrialOutcome,
  KycKind,
  KycStatus,
  DisputeStatus,
  DisputeParty,
  TicketStatus,
  TicketPriority,
} from "@prisma/client";
import prisma from "../src/config/prisma";
import { scopeOne } from "../src/modules/ai/ai.engine";
import { RATE_FLOOR } from "../src/modules/ai/ai.engine";

const PASSWORD = "Passw0rd!";
const TABLES = [
  "ChatMessage", "Dispute", "SupportTicket", "Evaluation", "PointEntry",
  "TrialAttempt", "TrialCheck", "Trial", "Payment", "PaymentMethod",
  "Task", "Job", "KycSubmission", "StudentProfile", "ClientProfile",
  "Sector", "User",
];

async function clearAll() {
  const list = TABLES.map((t) => `"${t}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE;`);
}

/**
 * Create the schema from the init migration if the tables don't exist yet, so
 * `npm run seed` works on a fresh database with no separate `prisma db push`.
 */
async function ensureSchema() {
  const already = await prisma.$queryRawUnsafe<{ exists: boolean }[]>(
    `SELECT to_regclass('public."User"') IS NOT NULL AS exists;`
  );
  if (already?.[0]?.exists) return;

  const sqlPath = path.join(__dirname, "migrations", "0001_init", "migration.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");
  for (const stmt of sql.split(";").map((s) => s.trim()).filter(Boolean)) {
    await prisma.$executeRawUnsafe(stmt);
  }
  console.log("✓ Schema created from migration.");
}

const SECTOR_NAMES: Record<string, string> = {
  it: "IT & Software",
  eng: "Engineering",
  biz: "Business, Finance & Accounting",
  design: "Graphic Design & Multimedia",
  social: "Social Science & Development",
  agri: "Agriculture & Environment",
  content: "Content, Journalism & English",
  mkt: "Digital Marketing & Sales",
  admin: "General Admin & Data Support",
};

let REF = 1000;
const ref = (p: string) => `${p}-${++REF}`;

async function main() {
  await ensureSchema();
  console.log("Clearing existing data…");
  await clearAll();

  const hash = await bcrypt.hash(PASSWORD, 10);

  // ── Sectors ──
  await prisma.sector.createMany({
    data: Object.keys(SECTOR_NAMES).map((id) => ({
      id,
      name: SECTOR_NAMES[id],
      rateFloor: RATE_FLOOR[id] ?? 300,
    })),
  });

  // ── Users ──
  const mod = await prisma.user.create({
    data: { email: "mod@demo.wb", password: hash, role: Role.MODERATOR, name: "Sabbir Rahman" },
  });
  await prisma.user.create({
    data: { email: "mod2@demo.wb", password: hash, role: Role.MODERATOR, name: "Rima Chowdhury" },
  });

  const c1 = await prisma.user.create({
    data: {
      email: "nokshi@demo.wb", password: hash, role: Role.CLIENT, name: "Nokshi Threads",
      clientProfile: { create: { businessName: "Nokshi Threads", industry: "Boutique retail", size: "9 staff", city: "Banani, Dhaka" } },
      paymentMethods: { create: [
        { kind: "bkash", label: "bKash merchant", isDefault: true },
        { kind: "bank", label: "Bank transfer" },
      ] },
    },
  });
  const c2 = await prisma.user.create({
    data: {
      email: "chaap@demo.wb", password: hash, role: Role.CLIENT, name: "Chaap Ghor",
      clientProfile: { create: { businessName: "Chaap Ghor", industry: "Restaurant chain", size: "34 staff", city: "Mirpur, Dhaka" } },
      paymentMethods: { create: [{ kind: "nagad", label: "Nagad", isDefault: true }] },
    },
  });
  const c3 = await prisma.user.create({
    data: {
      email: "shopno@demo.wb", password: hash, role: Role.CLIENT, name: "Shopno Agro",
      clientProfile: { create: { businessName: "Shopno Agro", industry: "Agri supply", size: "17 staff", city: "Bogura" } },
      paymentMethods: { create: [{ kind: "bank", label: "Bank transfer", isDefault: true }] },
    },
  });

  const mkStudent = (email: string, name: string, university: string, discipline: string, skills: string[], kyc: KycStatus) =>
    prisma.user.create({
      data: {
        email, password: hash, role: Role.STUDENT, name,
        studentProfile: { create: { university, discipline, year: "4th", city: "Dhaka", skills, rating: 4.7, onTime: 95, kycStatus: kyc } },
      },
    });

  const s1 = await mkStudent("nusrat@demo.wb", "Nusrat Jahan", "Jahangirnagar University", "CSE", ["React", "Next.js", "PostgreSQL"], KycStatus.VERIFIED);
  const s2 = await mkStudent("tanvir@demo.wb", "Tanvir Ahmed", "North South University", "BBA Finance", ["Excel", "Bookkeeping", "VAT"], KycStatus.VERIFIED);
  const s3 = await mkStudent("afsana@demo.wb", "Afsana Mim", "University of Dhaka", "Journalism", ["Copywriting", "EN⇄BN", "SEO"], KycStatus.VERIFIED);
  const s4 = await mkStudent("mehedi@demo.wb", "Mehedi Hasan", "Daffodil International University", "SWE", ["JavaScript", "QA"], KycStatus.PENDING);
  const s5 = await mkStudent("farzana@demo.wb", "Farzana Akter", "National University", "Marketing", ["Bangla copy", "Content"], KycStatus.PENDING);

  // ── helper: create a fully-scoped job + task from a brief ──
  async function makeJob(opts: {
    client: { id: string };
    sectorId: string;
    brief: string;
    jobStatus: JobStatus;
    taskStatus: TaskStatus;
    scopeApproved: boolean;
    trialCheck: TrialCheckStatus;
    payStatus: PayStatus;
    assigneeId?: string;
    progress?: number;
    submissionNote?: string;
    submitted?: boolean;
  }) {
    const scope = scopeOne(opts.brief, { sectorId: opts.sectorId });
    const level = scope.level === "micro" ? TaskLevel.MICRO : scope.level === "advanced" ? TaskLevel.ADVANCED : TaskLevel.STANDARD;
    const job = await prisma.job.create({
      data: {
        ref: ref("WB"),
        clientId: opts.client.id,
        title: scope.title,
        brief: opts.brief,
        sectorId: opts.sectorId,
        budget: scope.suggestedFee,
        status: opts.jobStatus,
        scopeApproved: opts.scopeApproved,
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
            sectorId: opts.sectorId,
            fee: scope.suggestedFee,
            hours: scope.estHours,
            level,
            skills: scope.skills,
            acceptance: scope.acceptance,
            status: opts.taskStatus,
            assigneeId: opts.assigneeId,
            progress: opts.progress ?? 0,
            submissionNote: opts.submissionNote,
            submittedAt: opts.submitted ? new Date() : null,
            trial: { create: { title: scope.trial.title, brief: scope.trial.brief, minutes: scope.trial.minutes, mirrors: scope.trial.mirrors, acceptance: scope.trial.acceptance, aiNote: scope.trial.mirrors } },
            trialCheck: { create: { status: opts.trialCheck, decidedAt: opts.trialCheck !== TrialCheckStatus.AWAITING_CLIENT ? new Date() : null } },
            payment: { create: { clientId: opts.client.id, amount: scope.suggestedFee, status: opts.payStatus, note: payNote(opts.payStatus) } },
          },
        },
      },
      include: { tasks: { include: { trial: true } } },
    });
    return { job, task: job.tasks[0] };
  }

  function payNote(s: PayStatus) {
    return s === PayStatus.HELD ? "Held in escrow until sign-off"
      : s === PayStatus.RELEASED ? "Released on client sign-off"
      : s === PayStatus.AWAITING ? "Awaiting deposit" : "";
  }

  const attempt = (taskId: string, studentId: string, score: number, outcome: TrialOutcome, points: number) =>
    prisma.trialAttempt.create({
      data: {
        taskId, studentId, minutesTaken: 35, summary: "Did the trial and flagged the unclear item rather than guessing.",
        aiScore: score, aiVerdict: `Solid attempt — scored ${score}/100 for judgement and completeness.`,
        aiCoaching: "Keep stating assumptions explicitly.", outcome, points,
        pointsReason: points === 1 ? "Did the trial, was not selected — +1" : points === 0 ? "Selected — 0" : "Selected but did not deliver — -1",
      },
    });
  const point = (studentId: string, taskId: string, delta: number, reason: string) =>
    prisma.pointEntry.create({ data: { studentId, taskId, delta, reason } });

  // ── J1: DELIVERED (client c1, student s1) ──
  const j1 = await makeJob({ client: c1, sectorId: "it", brief: "The checkout payment on our website keeps failing at the last step for customers.", jobStatus: JobStatus.DELIVERED, taskStatus: TaskStatus.APPROVED, scopeApproved: true, trialCheck: TrialCheckStatus.APPROVED, payStatus: PayStatus.RELEASED, assigneeId: s1.id, progress: 100, submissionNote: "Fixed the gateway callback; documented repro steps.", submitted: true });
  await attempt(j1.task.id, s1.id, 88, TrialOutcome.SELECTED, 0);
  await attempt(j1.task.id, s2.id, 74, TrialOutcome.NOT_SHORTLISTED, 1);
  await point(s1.id, j1.task.id, 0, "Selected and delivered the main task — 0");
  await point(s2.id, j1.task.id, 1, "Did the trial, was not selected — +1");
  await prisma.evaluation.create({ data: { taskId: j1.task.id, studentId: s1.id, reviewerId: mod.id, scores: [{ dim: "Quality", score: 5, max: 5 }, { dim: "Completeness", score: 4, max: 5 }, { dim: "Communication", score: 4, max: 5 }], reviewerNote: "Clean fix, well documented.", clientSignoff: true, clientNote: "Works perfectly, thank you." } });

  // ── J2: ACTIVE / IN_PROGRESS (c1, s1) ──
  const j2 = await makeJob({ client: c1, sectorId: "it", brief: "Build an inventory dashboard showing stock levels and a daily sales report.", jobStatus: JobStatus.ACTIVE, taskStatus: TaskStatus.IN_PROGRESS, scopeApproved: true, trialCheck: TrialCheckStatus.APPROVED, payStatus: PayStatus.HELD, assigneeId: s1.id, progress: 45 });
  await attempt(j2.task.id, s1.id, 85, TrialOutcome.SELECTED, 0);
  await attempt(j2.task.id, s3.id, 70, TrialOutcome.NOT_SHORTLISTED, 1);
  await point(s1.id, j2.task.id, 0, "Selected — main task in progress");
  await point(s3.id, j2.task.id, 1, "Did the trial, was not selected — +1");
  await prisma.chatMessage.createMany({ data: [
    { taskId: j2.task.id, authorId: c1.id, fromRole: Role.CLIENT, body: "Hi Nusrat — can the dashboard also show last week's totals?" },
    { taskId: j2.task.id, authorId: s1.id, fromRole: Role.STUDENT, body: "Yes, I'll add a weekly summary row. Will share a preview tomorrow." },
  ] });

  // ── J3: IN_REVIEW awaiting moderator scoring (c2, s2) ──
  const j3 = await makeJob({ client: c2, sectorId: "biz", brief: "Reconcile last quarter's invoices and VAT against the bank statement.", jobStatus: JobStatus.REVIEW, taskStatus: TaskStatus.IN_REVIEW, scopeApproved: true, trialCheck: TrialCheckStatus.APPROVED, payStatus: PayStatus.HELD, assigneeId: s2.id, progress: 100, submissionNote: "Reconciled; two entries flagged as exceptions with notes.", submitted: true });
  await attempt(j3.task.id, s2.id, 90, TrialOutcome.SELECTED, 0);
  await attempt(j3.task.id, s1.id, 68, TrialOutcome.NOT_SHORTLISTED, 1);
  await point(s2.id, j3.task.id, 0, "Selected — main task in progress");
  await point(s1.id, j3.task.id, 1, "Did the trial, was not selected — +1");

  // ── J4: MATCHING with applicants awaiting selection (c1) ──
  const j4 = await makeJob({ client: c1, sectorId: "design", brief: "Redesign our product packaging label in two sizes, prices in a separate layer.", jobStatus: JobStatus.MATCHING, taskStatus: TaskStatus.MATCHING, scopeApproved: true, trialCheck: TrialCheckStatus.APPROVED, payStatus: PayStatus.HELD });
  await attempt(j4.task.id, s3.id, 82, TrialOutcome.PENDING, 0);
  await attempt(j4.task.id, s1.id, 76, TrialOutcome.PENDING, 0);

  // ── J5: SCOPING awaiting moderator scope review (c2) ──
  await makeJob({ client: c2, sectorId: "mkt", brief: "Run a two-week social media campaign for our new menu across Facebook and Instagram.", jobStatus: JobStatus.SCOPING, taskStatus: TaskStatus.OPEN, scopeApproved: false, trialCheck: TrialCheckStatus.AWAITING_CLIENT, payStatus: PayStatus.AWAITING });

  // ── J6: MATCHING, no applicants yet (open on the board for students) (c1) ──
  await makeJob({ client: c1, sectorId: "content", brief: "Write ten product descriptions in our brand voice and translate them to Bangla.", jobStatus: JobStatus.MATCHING, taskStatus: TaskStatus.MATCHING, scopeApproved: true, trialCheck: TrialCheckStatus.APPROVED, payStatus: PayStatus.HELD });

  // ── J7: dispute (c2, s3) ──
  const j7 = await makeJob({ client: c2, sectorId: "admin", brief: "Enter 800 paper records into a spreadsheet with the agreed columns.", jobStatus: JobStatus.REVIEW, taskStatus: TaskStatus.IN_REVIEW, scopeApproved: true, trialCheck: TrialCheckStatus.APPROVED, payStatus: PayStatus.HELD, assigneeId: s3.id, progress: 100, submissionNote: "Entered; some records were illegible.", submitted: true });
  await attempt(j7.task.id, s3.id, 72, TrialOutcome.SELECTED, 0);
  await point(s3.id, j7.task.id, 0, "Selected — main task in progress");
  await prisma.dispute.create({ data: { ref: ref("DSP"), taskId: j7.task.id, raisedById: c2.id, raisedByRole: DisputeParty.CLIENT, status: DisputeStatus.OPEN, amount: j7.task.fee, claim: "Several records are missing and some are wrong.", evidence: ["Screenshot of missing rows", "Sample of incorrect entries"] } });

  // ── J8: c3 DELIVERED (agri, s2) ──
  const j8 = await makeJob({ client: c3, sectorId: "agri", brief: "Run a field survey of 200 farmers and write two findings from the crop data.", jobStatus: JobStatus.DELIVERED, taskStatus: TaskStatus.APPROVED, scopeApproved: true, trialCheck: TrialCheckStatus.APPROVED, payStatus: PayStatus.RELEASED, assigneeId: s2.id, progress: 100, submissionNote: "Survey done; two findings with sourced evidence.", submitted: true });
  await attempt(j8.task.id, s2.id, 80, TrialOutcome.SELECTED, 0);
  await point(s2.id, j8.task.id, 0, "Selected and delivered the main task — 0");
  await prisma.evaluation.create({ data: { taskId: j8.task.id, studentId: s2.id, reviewerId: mod.id, scores: [{ dim: "Quality", score: 4, max: 5 }, { dim: "Completeness", score: 4, max: 5 }, { dim: "Communication", score: 4, max: 5 }], reviewerNote: "Well sourced.", clientSignoff: true, clientNote: "Great work." } });

  // ── J9: c3 SCOPING awaiting moderator review ──
  await makeJob({ client: c3, sectorId: "admin", brief: "Digitise 500 paper delivery slips into a clean spreadsheet with agreed columns.", jobStatus: JobStatus.SCOPING, taskStatus: TaskStatus.OPEN, scopeApproved: false, trialCheck: TrialCheckStatus.AWAITING_CLIENT, payStatus: PayStatus.AWAITING });

  // ── KYC submissions pending (s4, s5) ──
  const docs = [
    { label: "Recommendation letter", detail: "Department head, signed and sealed", ok: false },
    { label: "Student ID card", detail: "Valid to 2027", ok: false },
    { label: "Transcript / certificate", detail: "Provisional certificate", ok: false },
    { label: "NID", detail: "Name matches student ID", ok: false },
    { label: "Payout account", detail: "bKash personal", ok: false },
  ];
  await prisma.kycSubmission.create({ data: { kind: KycKind.STUDENT, subjectId: s4.id, status: KycStatus.PENDING, documents: docs } });
  await prisma.kycSubmission.create({ data: { kind: KycKind.STUDENT, subjectId: s5.id, status: KycStatus.PENDING, documents: docs } });

  // ── Support tickets ──
  await prisma.supportTicket.create({ data: { ref: ref("TKT"), fromId: c1.id, subject: "Change my payout method", body: "How do I switch my default from bKash to bank?", status: TicketStatus.NEW, priority: TicketPriority.NORMAL } });
  await prisma.supportTicket.create({ data: { ref: ref("TKT"), fromId: s4.id, subject: "Verification pending", body: "My documents have been pending for a few days.", status: TicketStatus.NEW, priority: TicketPriority.HIGH } });

  console.log("\n✓ Seed complete (3 clients, 2 moderators, 5 students).\n");
  console.log("Demo logins (password for all: " + PASSWORD + "):");
  console.log("  Clients    nokshi@demo.wb, chaap@demo.wb, shopno@demo.wb");
  console.log("  Students   nusrat@demo.wb, tanvir@demo.wb, afsana@demo.wb (verified); mehedi@demo.wb, farzana@demo.wb (pending)");
  console.log("  Moderators mod@demo.wb, mod2@demo.wb");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
