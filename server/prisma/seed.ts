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
import { scopeOne, evaluateAttemptDeterministic } from "../src/modules/ai/ai.engine";
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
  const run = async (name: string) => {
    const sql = fs.readFileSync(path.join(__dirname, "migrations", name, "migration.sql"), "utf8");
    for (const stmt of sql.split(";").map((s) => s.trim()).filter(Boolean)) {
      await prisma.$executeRawUnsafe(stmt);
    }
  };
  if (!already?.[0]?.exists) {
    await run("0001_init");
    console.log("✓ Schema created from migration.");
  }
  // Idempotent (ADD COLUMN IF NOT EXISTS) — brings an older database up to date.
  await run("0002_trial_shortlist");
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
    submissionFiles?: unknown;
    attachments?: unknown;
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
        attachments: (opts.attachments as any) ?? undefined,
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
            submissionFiles: (opts.submissionFiles as any) ?? undefined,
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

  // ── Uploaded deliverables (metadata + extracted text; no binary stored) ──
  const uf = (name: string, mime: string, content: string) => ({ name, mime, size: content.length, content });
  const fileAtt = (name: string, mime: string, content: string) => ({ kind: "file", name, files: [uf(name, mime, content)] });
  const folderAtt = (name: string, files: ReturnType<typeof uf>[]) => ({ kind: "folder", name, files });
  // A small, sector-flavoured trial deliverable that flags the deliberate ambiguity.
  const trialAtt = (sector: string) => {
    switch (sector) {
      case "it": return [folderAtt("trial-checkout", [uf("repro.md", "text/markdown", "# Repro\n1. Add item to cart\n2. Go to checkout\n3. Pay — fails at the callback.\nStep 3 would not reproduce on staging, so I flagged it rather than inventing a cause."), uf("callback.patch.txt", "text/plain", "- res.redirect(cb)\n+ if (!verifySignature(req)) return res.status(400);\n+ res.redirect(cb);")])];
      case "biz": return [fileAtt("reconcile-week1.csv", "text/csv", "date,ref,amount,matched\n01-03,INV-88,12000,yes\n02-03,INV-89,8400,no\n03-03,INV-90,5100,no\n# 2 entries would not reconcile — listed as exceptions, not forced to match.")];
      case "admin": return [fileAtt("records-12.csv", "text/csv", "id,name,phone\n1,Rahim,017xxxxxxxx\n2,Karim,\n3,[illegible],018xxxxxxxx\n# rows 2 and 3 unclear — flagged, not guessed.")];
      case "design": return [fileAtt("label-two-sizes.md", "text/markdown", "Laid the label out at two sizes. Prices kept in a SEPARATE editable layer — I need the final price list confirmed before export rather than baking numbers in.")];
      // J4's live round: two strong attempts (AI-shortlisted, ranked) and one below the bar.
      case "design-strong": return [folderAtt("label-redesign", [
        { name: "label-redesign/label-a6.png", mime: "image/png", size: 248000, content: null as any },
        { name: "label-redesign/label-a7.png", mime: "image/png", size: 176000, content: null as any },
        uf("label-redesign/label-source.svg", "image/svg+xml", "<svg xmlns='http://www.w3.org/2000/svg' width='105mm' height='148mm'>\n<g id='artwork'><text>Nokshi Threads — hand-embroidered cushion cover</text></g>\n<g id='prices' data-editable='true'><text id='price'>৳1,450</text></g>\n</svg>"),
        uf("label-redesign/NOTES.md", "text/markdown", "# Packaging label redesign\nTwo sizes exported: A6 (105x148mm) and A7 (74x105mm), both from the same editable source file.\nPrices sit in their own layer (`prices`) so they can change without touching the artwork.\n## Flagged\nThe current price list has two prices for the cushion cover (৳1,450 on the tag, ৳1,500 on the site) — I left the layer editable and need the client to confirm which is right instead of guessing."),
      ])];
      case "design-good": return [folderAtt("label-v1", [
        { name: "label-v1/label-large.png", mime: "image/png", size: 210000, content: null as any },
        { name: "label-v1/label-small.png", mime: "image/png", size: 150000, content: null as any },
        { name: "label-v1/label.fig", mime: "application/octet-stream", size: 820000, content: null as any },
        uf("label-v1/readme.txt", "text/plain", "Packaging label redesigned at two sizes (large and small), exported as PNG from the editable Figma source.\nThe prices are in a separate layer named Prices so they stay editable.\nQuestion: which font should the brand name use? I kept the old one for now."),
      ])];
      case "design-weak": return [{ kind: "file", name: "label.png", files: [{ name: "label.png", mime: "image/png", size: 0, content: null as any }] }];
      case "content": return [fileAtt("entries.md", "text/markdown", "Three product descriptions in the site's voice.\nNote: item 2's name differs between the tag and the site — asking which is correct rather than choosing.")];
      case "agri": return [fileAtt("findings.md", "text/markdown", "Two findings from one season of the sample. Evidence is thin for finding 2, so I stated where I am unsure instead of overclaiming.")];
      default: return [fileAtt("trial-notes.md", "text/markdown", "Did the sample and flagged the one item that did not add up instead of guessing.")];
    }
  };
  // The full deliverable a selected student submits for review.
  const subAtt = (sector: string) => {
    switch (sector) {
      case "it": return [folderAtt("checkout-fix", [uf("gateway-callback.js", "text/javascript", "// verify the gateway signature before redirecting the customer\nexport function handleCallback(req, res) { /* ... */ }"), uf("REPRO.md", "text/markdown", "Steps to reproduce the original failure and how the fix resolves it."), uf("before-after.log", "text/plain", "before: HTTP 500 at /callback\nafter: HTTP 200 OK, order marked paid")])];
      case "biz": return [folderAtt("reconciliation", [uf("reconciliation.csv", "text/csv", "date,ref,amount,matched\n... full quarter reconciled ..."), uf("exceptions.md", "text/markdown", "Two entries flagged as exceptions with a note on why each could not be matched.")])];
      case "admin": return [fileAtt("records-800.csv", "text/csv", "id,name,phone,address\n... 800 rows entered into the agreed columns ...\n# some source records were illegible and are flagged, not guessed.")];
      case "agri": return [folderAtt("field-survey", [uf("survey-200.csv", "text/csv", "farmer,upazila,crop,yield\n... 200 responses ..."), uf("findings.md", "text/markdown", "Two findings, each sourced to the sample rows that support it.")])];
      default: return [fileAtt("deliverable.md", "text/markdown", "Work delivered as agreed against the acceptance criteria.")];
    }
  };

  // Every seeded attempt is judged by the same AI judge the API uses, so its
  // completion %, checklist and shortlist status are real. `outcome` overrides
  // the judge only for rounds that are already decided (selected / not selected).
  const attempt = async (
    task: { id: string; acceptance: string[]; trial: { title: string; brief: string; minutes: number; acceptance: string[] } | null },
    studentId: string,
    outcome: TrialOutcome | "JUDGE",
    points: number,
    attachments: any[],
    summary = "Did the trial on the sample and flagged the unclear item rather than guessing.",
    minutesTaken = 35
  ) => {
    const ev = evaluateAttemptDeterministic({
      trialTitle: task.trial!.title,
      trialBrief: task.trial!.brief,
      requirements: task.trial!.acceptance,
      trialMinutes: task.trial!.minutes,
      summary,
      minutesTaken,
      attachments,
      taskAcceptance: task.acceptance,
    });
    const finalOutcome = outcome === "JUDGE" ? (ev.shortlisted ? TrialOutcome.SHORTLISTED : TrialOutcome.NOT_SHORTLISTED) : outcome;
    return prisma.trialAttempt.create({
      data: {
        taskId: task.id, studentId, minutesTaken, summary,
        aiScore: ev.score, completion: ev.completion, checklist: ev.checklist as any, aiFlags: ev.flags, aiSource: ev.source,
        aiVerdict: ev.verdict, aiCoaching: ev.coaching, outcome: finalOutcome, points,
        rank: finalOutcome === TrialOutcome.SELECTED ? 1 : 0,
        pointsReason: outcome === "JUDGE" ? null : points === 1 ? "Did the trial, was not selected — +1" : points === 0 ? "Selected — 0" : "Selected but did not deliver — -1",
        attachments: attachments as any,
      },
    });
  };
  const point = (studentId: string, taskId: string, delta: number, reason: string) =>
    prisma.pointEntry.create({ data: { studentId, taskId, delta, reason } });

  // ── J1: DELIVERED (client c1, student s1) ──
  const j1 = await makeJob({ client: c1, sectorId: "it", brief: "The checkout payment on our website keeps failing at the last step for customers.", jobStatus: JobStatus.DELIVERED, taskStatus: TaskStatus.APPROVED, scopeApproved: true, trialCheck: TrialCheckStatus.APPROVED, payStatus: PayStatus.RELEASED, assigneeId: s1.id, progress: 100, submissionNote: "Fixed the gateway callback; documented repro steps.", submissionFiles: subAtt("it"), submitted: true });
  await attempt(j1.task, s1.id, TrialOutcome.SELECTED, 0, trialAtt("it"));
  await attempt(j1.task, s2.id, TrialOutcome.NOT_SHORTLISTED, 1, trialAtt("it"));
  await point(s1.id, j1.task.id, 0, "Selected and delivered the main task — 0");
  await point(s2.id, j1.task.id, 1, "Did the trial, was not selected — +1");
  await prisma.evaluation.create({ data: { taskId: j1.task.id, studentId: s1.id, reviewerId: mod.id, scores: [{ dim: "Quality", score: 5, max: 5 }, { dim: "Completeness", score: 4, max: 5 }, { dim: "Communication", score: 4, max: 5 }], reviewerNote: "Clean fix, well documented.", clientSignoff: true, clientNote: "Works perfectly, thank you." } });

  // ── J2: ACTIVE / IN_PROGRESS (c1, s1) ──
  const j2 = await makeJob({ client: c1, sectorId: "it", brief: "Build an inventory dashboard showing stock levels and a daily sales report.", jobStatus: JobStatus.ACTIVE, taskStatus: TaskStatus.IN_PROGRESS, scopeApproved: true, trialCheck: TrialCheckStatus.APPROVED, payStatus: PayStatus.HELD, assigneeId: s1.id, progress: 45 });
  await attempt(j2.task, s1.id, TrialOutcome.SELECTED, 0, trialAtt("it"));
  await attempt(j2.task, s3.id, TrialOutcome.NOT_SHORTLISTED, 1, trialAtt("it"));
  await point(s1.id, j2.task.id, 0, "Selected — main task in progress");
  await point(s3.id, j2.task.id, 1, "Did the trial, was not selected — +1");
  await prisma.chatMessage.createMany({ data: [
    { taskId: j2.task.id, authorId: c1.id, fromRole: Role.CLIENT, body: "Hi Nusrat — can the dashboard also show last week's totals?" },
    { taskId: j2.task.id, authorId: s1.id, fromRole: Role.STUDENT, body: "Yes, I'll add a weekly summary row. Will share a preview tomorrow." },
  ] });

  // ── J3: IN_REVIEW awaiting moderator scoring (c2, s2) ──
  const j3 = await makeJob({ client: c2, sectorId: "biz", brief: "Reconcile last quarter's invoices and VAT against the bank statement.", jobStatus: JobStatus.REVIEW, taskStatus: TaskStatus.IN_REVIEW, scopeApproved: true, trialCheck: TrialCheckStatus.APPROVED, payStatus: PayStatus.HELD, assigneeId: s2.id, progress: 100, submissionNote: "Reconciled; two entries flagged as exceptions with notes.", submissionFiles: subAtt("biz"), submitted: true });
  await attempt(j3.task, s2.id, TrialOutcome.SELECTED, 0, trialAtt("biz"));
  await attempt(j3.task, s1.id, TrialOutcome.NOT_SHORTLISTED, 1, trialAtt("biz"));
  await point(s2.id, j3.task.id, 0, "Selected — main task in progress");
  await point(s1.id, j3.task.id, 1, "Did the trial, was not selected — +1");

  // ── J4: MATCHING with applicants awaiting selection (c1) ──
  const j4 = await makeJob({ client: c1, sectorId: "design", brief: "Redesign our product packaging label in two sizes, prices in a separate layer.", jobStatus: JobStatus.MATCHING, taskStatus: TaskStatus.MATCHING, scopeApproved: true, trialCheck: TrialCheckStatus.APPROVED, payStatus: PayStatus.HELD });
  // Judged by the AI: s3 and s1 clear the 90% bar (ranked), s2 does not.
  await attempt(j4.task, s3.id, "JUDGE", 0, trialAtt("design-strong"), "Redesigned the label at two sizes (A6, A7) from one editable source; prices in their own layer; flagged the price mismatch.", 40);
  await attempt(j4.task, s1.id, "JUDGE", 0, trialAtt("design-good"), "Label at two sizes, prices on a separate layer, exported from the Figma source.", 50);
  await attempt(j4.task, s2.id, "JUDGE", 0, trialAtt("design-weak"), "Made a new label.", 20);
  const ranked = await prisma.trialAttempt.findMany({ where: { taskId: j4.task.id, outcome: TrialOutcome.SHORTLISTED }, orderBy: [{ completion: "desc" }, { aiScore: "desc" }, { submittedAt: "asc" }] });
  for (const [i, a] of ranked.entries()) await prisma.trialAttempt.update({ where: { id: a.id }, data: { rank: i + 1 } });

  // ── J5: posted, AI trial awaiting the client's check (c2) ──
  await makeJob({ client: c2, sectorId: "mkt", brief: "Run a two-week social media campaign for our new menu across Facebook and Instagram.", jobStatus: JobStatus.SCOPING, taskStatus: TaskStatus.OPEN, scopeApproved: true, trialCheck: TrialCheckStatus.AWAITING_CLIENT, payStatus: PayStatus.AWAITING, attachments: [fileAtt("new-menu.csv", "text/csv", "item,price\nChicken Chaap,320\nBeef Tehari,260\nBorhani,60"), fileAtt("brand-notes.md", "text/markdown", "Tone: warm, local, a little playful. Post times: 1pm and 8pm. Avoid stock photos.")] });

  // ── J6: MATCHING, no applicants yet (open on the board for students) (c1) ──
  await makeJob({ client: c1, sectorId: "content", brief: "Write ten product descriptions in our brand voice and translate them to Bangla.", jobStatus: JobStatus.MATCHING, taskStatus: TaskStatus.MATCHING, scopeApproved: true, trialCheck: TrialCheckStatus.APPROVED, payStatus: PayStatus.HELD });

  // ── J7: dispute (c2, s3) ──
  const j7 = await makeJob({ client: c2, sectorId: "admin", brief: "Enter 800 paper records into a spreadsheet with the agreed columns.", jobStatus: JobStatus.REVIEW, taskStatus: TaskStatus.IN_REVIEW, scopeApproved: true, trialCheck: TrialCheckStatus.APPROVED, payStatus: PayStatus.HELD, assigneeId: s3.id, progress: 100, submissionNote: "Entered; some records were illegible.", submissionFiles: subAtt("admin"), submitted: true });
  await attempt(j7.task, s3.id, TrialOutcome.SELECTED, 0, trialAtt("admin"));
  await point(s3.id, j7.task.id, 0, "Selected — main task in progress");
  await prisma.dispute.create({ data: { ref: ref("DSP"), taskId: j7.task.id, raisedById: c2.id, raisedByRole: DisputeParty.CLIENT, status: DisputeStatus.OPEN, amount: j7.task.fee, claim: "Several records are missing and some are wrong.", evidence: ["Screenshot of missing rows", "Sample of incorrect entries"] } });

  // ── J8: c3 DELIVERED (agri, s2) ──
  const j8 = await makeJob({ client: c3, sectorId: "agri", brief: "Run a field survey of 200 farmers and write two findings from the crop data.", jobStatus: JobStatus.DELIVERED, taskStatus: TaskStatus.APPROVED, scopeApproved: true, trialCheck: TrialCheckStatus.APPROVED, payStatus: PayStatus.RELEASED, assigneeId: s2.id, progress: 100, submissionNote: "Survey done; two findings with sourced evidence.", submissionFiles: subAtt("agri"), submitted: true });
  await attempt(j8.task, s2.id, TrialOutcome.SELECTED, 0, trialAtt("agri"));
  await point(s2.id, j8.task.id, 0, "Selected and delivered the main task — 0");
  await prisma.evaluation.create({ data: { taskId: j8.task.id, studentId: s2.id, reviewerId: mod.id, scores: [{ dim: "Quality", score: 4, max: 5 }, { dim: "Completeness", score: 4, max: 5 }, { dim: "Communication", score: 4, max: 5 }], reviewerNote: "Well sourced.", clientSignoff: true, clientNote: "Great work." } });

  // ── J9: c3 posted, AI trial awaiting the client's check ──
  await makeJob({ client: c3, sectorId: "admin", brief: "Digitise 500 paper delivery slips into a clean spreadsheet with agreed columns.", jobStatus: JobStatus.SCOPING, taskStatus: TaskStatus.OPEN, scopeApproved: true, trialCheck: TrialCheckStatus.AWAITING_CLIENT, payStatus: PayStatus.AWAITING, attachments: [fileAtt("slip-sample.md", "text/markdown", "Each slip has: date, route, driver, crates out, crates returned, signature. Some handwriting is faint.")] });

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
