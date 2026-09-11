/**
 * In-browser demo backend for the public "Live demo".
 *
 * It answers the same endpoints as the real API (see ../api.ts) with the same
 * response shapes and the same flow rules as the server's services, backed by
 * a small seeded dataset kept in sessionStorage. The three demo roles share
 * one dataset, so work moves between them exactly as it would for real:
 *   client posts (stored at once, no approval step) -> AI builds a small
 *   same-feature trial -> client approves it (or asks for changes and the AI
 *   rebuilds it) -> task is live on the board -> students upload their trial
 *   work, the AI judges every requirement and shortlists 90%+ -> client funds
 *   escrow -> moderator selects from the shortlist -> student delivers
 *   -> moderator scores -> client signs off -> escrow releases.
 * Nothing leaves the browser.
 */
import { ApiError, type Role, type Attachment, type UploadedFile } from "../api";
import { RATE_FLOOR, priceCheck, scopeOne, buildTrial } from "../engine";
import { judgeAttempt, rankAttempts, SHORTLIST_BAR, type ChecklistItem } from "../judge";
import { sectorById } from "@/data/sectors";

const DB_KEY = "wb.demo.db.v3"; // v3: AI shortlist (completion + checklist), no scope approval

/* ── Records ─────────────────────────────────────────────────── */

type StudentProfile = { university: string; discipline: string; year: string; city: string; skills: string[]; kycStatus: string };
type ClientProfile = { businessName: string; industry: string; size: string; city: string };
type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  studentProfile?: StudentProfile;
  clientProfile?: ClientProfile;
};
type Score = { dim: string; score: number; max: number };
type Task = {
  id: string;
  jobId: string;
  title: string;
  desc: string;
  sectorId: string;
  fee: number;
  hours: number;
  level: string;
  skills: string[];
  acceptance: string[];
  status: string;
  assigneeId: string | null;
  progress: number;
  submissionNote: string | null;
  submissionFiles?: Attachment[] | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  trial: { title: string; brief: string; minutes: number; mirrors: string; acceptance: string[]; revision?: number; aiNote?: string | null };
  trialCheck: { status: string; clientNote?: string };
  payment: { id: string; amount: number; status: string; note: string; method: string | null; clientId: string; createdAt: string; updatedAt: string };
  evaluation: { id: string; taskId: string; studentId: string | null; reviewerId: string; scores: Score[]; reviewerNote: string; clientSignoff: boolean; clientNote: string | null } | null;
};
type Job = {
  id: string;
  ref: string;
  clientId: string;
  title: string;
  brief: string;
  sectorId: string;
  budget: number;
  status: string;
  scopeApproved: boolean;
  aiSummary: string;
  aiComplexity: string;
  aiConfidence: number;
  aiEstHours: number;
  aiSuggestedFee: number;
  aiRisks: string[];
  aiSkills: string[];
  attachments?: Attachment[] | null;
  createdAt: string;
};
type Attempt = {
  id: string;
  taskId: string;
  studentId: string;
  summary: string;
  minutesTaken: number;
  attachments?: Attachment[];
  aiScore: number;
  completion: number;
  checklist: ChecklistItem[];
  aiFlags: string[];
  aiSource: string;
  aiVerdict: string;
  aiCoaching: string;
  outcome: string;
  points: number;
  pointsReason: string | null;
  rank: number | null;
  submittedAt: string;
};
type Point = { id: string; studentId: string; taskId: string; delta: number; reason: string; createdAt: string };
type Kyc = { id: string; subjectId: string; kind: string; status: string; documents: { label: string; detail: string; ok: boolean }[]; note: string | null; createdAt: string };
type Dispute = { id: string; ref: string; taskId: string; raisedById: string; raisedByRole: string; status: string; amount: number; claim: string; evidence: string[]; outcome: string | null; resolution: string | null; createdAt: string };
type Ticket = { id: string; ref: string; fromId: string; subject: string; body: string; priority: string; status: string; reply: string | null; createdAt: string };
type Message = { id: string; taskId: string; authorId: string; fromRole: Role; body: string; createdAt: string };
type Method = { id: string; clientId: string; kind: string; label: string; isDefault: boolean; createdAt: string };

type DB = {
  seq: number;
  users: User[];
  jobs: Job[];
  tasks: Task[];
  attempts: Attempt[];
  points: Point[];
  kyc: Kyc[];
  disputes: Dispute[];
  tickets: Ticket[];
  messages: Message[];
  methods: Method[];
};

/* ── Seed ────────────────────────────────────────────────────── */

function seed(): DB {
  const t0 = Date.now();
  let clock = 0;
  // Every record gets a distinct timestamp, oldest first, so "latest first" sorts are stable.
  const at = () => new Date(t0 - 30 * 864e5 + ++clock * 36e5).toISOString();

  const db: DB = { seq: 1000, users: [], jobs: [], tasks: [], attempts: [], points: [], kyc: [], disputes: [], tickets: [], messages: [], methods: [] };
  const id = (p: string) => `${p}${++db.seq}`;

  const user = (u: Omit<User, "isActive" | "createdAt" | "phone">) => db.users.push({ ...u, phone: null, isActive: true, createdAt: at() });
  user({ id: "m1", role: "MODERATOR", name: "Sabbir Rahman", email: "mod@demo.wb" });
  user({ id: "m2", role: "MODERATOR", name: "Rima Chowdhury", email: "mod2@demo.wb" });
  user({ id: "c1", role: "CLIENT", name: "Nokshi Threads", email: "nokshi@demo.wb", clientProfile: { businessName: "Nokshi Threads", industry: "Boutique retail", size: "9 staff", city: "Banani, Dhaka" } });
  user({ id: "c2", role: "CLIENT", name: "Chaap Ghor", email: "chaap@demo.wb", clientProfile: { businessName: "Chaap Ghor", industry: "Restaurant chain", size: "34 staff", city: "Mirpur, Dhaka" } });
  user({ id: "c3", role: "CLIENT", name: "Shopno Agro", email: "shopno@demo.wb", clientProfile: { businessName: "Shopno Agro", industry: "Agri supply", size: "17 staff", city: "Bogura" } });
  const student = (sid: string, name: string, email: string, university: string, discipline: string, skills: string[], kycStatus: string) =>
    user({ id: sid, role: "STUDENT", name, email, studentProfile: { university, discipline, year: "4th", city: "Dhaka", skills, kycStatus } });
  student("s1", "Nusrat Jahan", "nusrat@demo.wb", "Jahangirnagar University", "CSE", ["React", "Next.js", "PostgreSQL"], "VERIFIED");
  student("s2", "Tanvir Ahmed", "tanvir@demo.wb", "North South University", "BBA Finance", ["Excel", "Bookkeeping", "VAT"], "VERIFIED");
  student("s3", "Afsana Mim", "afsana@demo.wb", "University of Dhaka", "Journalism", ["Copywriting", "EN⇄BN", "SEO"], "VERIFIED");
  student("s4", "Mehedi Hasan", "mehedi@demo.wb", "Daffodil International University", "SWE", ["JavaScript", "QA"], "PENDING");
  student("s5", "Farzana Akter", "farzana@demo.wb", "National University", "Marketing", ["Bangla copy", "Content"], "PENDING");

  db.methods.push(
    { id: id("pm"), clientId: "c1", kind: "bkash", label: "bKash merchant", isDefault: true, createdAt: at() },
    { id: id("pm"), clientId: "c1", kind: "bank", label: "Bank transfer", isDefault: false, createdAt: at() },
    { id: id("pm"), clientId: "c2", kind: "nagad", label: "Nagad", isDefault: true, createdAt: at() },
    { id: id("pm"), clientId: "c3", kind: "bank", label: "Bank transfer", isDefault: true, createdAt: at() }
  );

  const job = (o: {
    clientId: string;
    sectorId: string;
    brief: string;
    jobStatus: string;
    taskStatus: string;
    scopeApproved: boolean;
    trialCheck: string;
    pay: string;
    assigneeId?: string;
    progress?: number;
    submissionNote?: string;
    submissionFiles?: Attachment[];
    attachments?: Attachment[];
  }) => {
    const created = buildJob(db, o.clientId, o.brief, { sectorId: o.sectorId, attachments: o.attachments }, at());
    Object.assign(created.job, { status: o.jobStatus, scopeApproved: o.scopeApproved });
    Object.assign(created.task, {
      status: o.taskStatus,
      assigneeId: o.assigneeId ?? null,
      progress: o.progress ?? 0,
      submissionNote: o.submissionNote ?? null,
      submissionFiles: o.submissionFiles ?? null,
      submittedAt: o.submissionNote ? at() : null,
    });
    created.task.trialCheck.status = o.trialCheck;
    created.task.payment.status = o.pay;
    created.task.payment.note = payNote(o.pay);
    return created.task;
  };
  // Every seeded attempt is judged by the same AI judge the API uses, so its
  // completion %, checklist and shortlist status are real. `outcome` overrides
  // the judge only for rounds that are already decided.
  const attempt = (
    taskId: string,
    studentId: string,
    outcome: string,
    points: number,
    attachments: Attachment[],
    summary = "Did the trial on the sample and flagged the unclear item rather than guessing.",
    minutesTaken = 35
  ) => {
    const t = db.tasks.find((x) => x.id === taskId)!;
    const ev = judgeAttempt({ trialTitle: t.trial.title, trialBrief: t.trial.brief, requirements: t.trial.acceptance, trialMinutes: t.trial.minutes, summary, minutesTaken, attachments, taskAcceptance: t.acceptance });
    const finalOutcome = outcome === "JUDGE" ? (ev.shortlisted ? "SHORTLISTED" : "NOT_SHORTLISTED") : outcome;
    db.attempts.push({
      id: id("a"),
      taskId,
      studentId,
      attachments,
      summary,
      minutesTaken,
      aiScore: ev.score,
      completion: ev.completion,
      checklist: ev.checklist,
      aiFlags: ev.flags,
      aiSource: ev.source,
      aiVerdict: ev.verdict,
      aiCoaching: ev.coaching,
      outcome: finalOutcome,
      points,
      pointsReason: outcome === "JUDGE" ? null : points === 1 ? "Did the trial, was not selected — +1" : "Selected — 0",
      rank: finalOutcome === "SELECTED" ? 1 : null,
      submittedAt: at(),
    });
  };
  const point = (studentId: string, taskId: string, delta: number, reason: string) =>
    db.points.push({ id: id("p"), studentId, taskId, delta, reason, createdAt: at() });
  const evaluate = (task: Task, scores: number[], reviewerNote: string, signed: boolean, clientNote: string | null) => {
    task.evaluation = {
      id: id("e"),
      taskId: task.id,
      studentId: task.assigneeId,
      reviewerId: "m1",
      scores: ["Quality", "Completeness", "Communication"].map((dim, i) => ({ dim, score: scores[i], max: 5 })),
      reviewerNote,
      clientSignoff: signed,
      clientNote,
    };
  };

  // J1 — delivered (c1, s1)
  const j1 = job({ clientId: "c1", sectorId: "it", brief: "The checkout payment on our website keeps failing at the last step for customers.", jobStatus: "DELIVERED", taskStatus: "APPROVED", scopeApproved: true, trialCheck: "APPROVED", pay: "RELEASED", assigneeId: "s1", progress: 100, submissionNote: "Fixed the gateway callback; documented repro steps.", submissionFiles: subAtt("it") });
  attempt(j1.id, "s1", "SELECTED", 0, trialAtt("it"));
  attempt(j1.id, "s2", "NOT_SHORTLISTED", 1, trialAtt("it"));
  point("s1", j1.id, 0, "Selected and delivered the main task — 0");
  point("s2", j1.id, 1, "Did the trial, was not selected — +1");
  evaluate(j1, [5, 4, 4], "Clean fix, well documented.", true, "Works perfectly, thank you.");

  // J2 — in progress (c1, s1)
  const j2 = job({ clientId: "c1", sectorId: "it", brief: "Build an inventory dashboard showing stock levels and a daily sales report.", jobStatus: "ACTIVE", taskStatus: "IN_PROGRESS", scopeApproved: true, trialCheck: "APPROVED", pay: "HELD", assigneeId: "s1", progress: 45 });
  attempt(j2.id, "s1", "SELECTED", 0, trialAtt("it"));
  attempt(j2.id, "s3", "NOT_SHORTLISTED", 1, trialAtt("it"));
  point("s1", j2.id, 0, "Selected — main task in progress");
  point("s3", j2.id, 1, "Did the trial, was not selected — +1");
  db.messages.push(
    { id: id("msg"), taskId: j2.id, authorId: "c1", fromRole: "CLIENT", body: "Hi Nusrat — can the dashboard also show last week's totals?", createdAt: at() },
    { id: id("msg"), taskId: j2.id, authorId: "s1", fromRole: "STUDENT", body: "Yes, I'll add a weekly summary row. Will share a preview tomorrow.", createdAt: at() }
  );

  // J3 — delivered, awaiting moderator scoring (c2, s2)
  const j3 = job({ clientId: "c2", sectorId: "biz", brief: "Reconcile last quarter's invoices and VAT against the bank statement.", jobStatus: "REVIEW", taskStatus: "IN_REVIEW", scopeApproved: true, trialCheck: "APPROVED", pay: "HELD", assigneeId: "s2", progress: 100, submissionNote: "Reconciled; two entries flagged as exceptions with notes.", submissionFiles: subAtt("biz") });
  attempt(j3.id, "s2", "SELECTED", 0, trialAtt("biz"));
  attempt(j3.id, "s1", "NOT_SHORTLISTED", 1, trialAtt("biz"));
  point("s2", j3.id, 0, "Selected — main task in progress");
  point("s1", j3.id, 1, "Did the trial, was not selected — +1");

  // J4 — live with applicants awaiting selection (c1)
  const j4 = job({ clientId: "c1", sectorId: "design", brief: "Redesign our product packaging label in two sizes, prices in a separate layer.", jobStatus: "MATCHING", taskStatus: "MATCHING", scopeApproved: true, trialCheck: "APPROVED", pay: "HELD" });
  // Judged by the AI: s3 and s1 clear the 90% bar (ranked), s2 does not.
  attempt(j4.id, "s3", "JUDGE", 0, trialAtt("design-strong"), "Redesigned the label at two sizes (A6, A7) from one editable source; prices in their own layer; flagged the price mismatch.", 40);
  attempt(j4.id, "s1", "JUDGE", 0, trialAtt("design-good"), "Label at two sizes, prices on a separate layer, exported from the Figma source.", 50);
  attempt(j4.id, "s2", "JUDGE", 0, trialAtt("design-weak"), "Made a new label.", 20);
  rerank(db, j4.id);

  // J5 — awaiting moderator scope review (c2)
  job({ clientId: "c2", sectorId: "mkt", brief: "Run a two-week social media campaign for our new menu across Facebook and Instagram.", jobStatus: "SCOPING", taskStatus: "OPEN", scopeApproved: true, trialCheck: "AWAITING_CLIENT", pay: "AWAITING", attachments: [fileAtt("new-menu.csv", "text/csv", "item,price\nChicken Chaap,320\nBeef Tehari,260\nBorhani,60"), fileAtt("brand-notes.md", "text/markdown", "Tone: warm, local, a little playful. Post times: 1pm and 8pm. Avoid stock photos.")] });

  // J6 — live on the board, no applicants yet (c1)
  job({ clientId: "c1", sectorId: "content", brief: "Write ten product descriptions in our brand voice and translate them to Bangla.", jobStatus: "MATCHING", taskStatus: "MATCHING", scopeApproved: true, trialCheck: "APPROVED", pay: "HELD" });

  // J7 — delivered but disputed by the client (c2, s3)
  const j7 = job({ clientId: "c2", sectorId: "admin", brief: "Enter 800 paper records into a spreadsheet with the agreed columns.", jobStatus: "REVIEW", taskStatus: "IN_REVIEW", scopeApproved: true, trialCheck: "APPROVED", pay: "HELD", assigneeId: "s3", progress: 100, submissionNote: "Entered; some records were illegible.", submissionFiles: subAtt("admin") });
  attempt(j7.id, "s3", "SELECTED", 0, trialAtt("admin"));
  point("s3", j7.id, 0, "Selected — main task in progress");
  db.disputes.push({ id: id("d"), ref: `DSP-${db.seq}`, taskId: j7.id, raisedById: "c2", raisedByRole: "CLIENT", status: "OPEN", amount: j7.fee, claim: "Several records are missing and some are wrong.", evidence: ["Screenshot of missing rows", "Sample of incorrect entries"], outcome: null, resolution: null, createdAt: at() });

  // J8 — delivered (c3, s2)
  const j8 = job({ clientId: "c3", sectorId: "agri", brief: "Run a field survey of 200 farmers and write two findings from the crop data.", jobStatus: "DELIVERED", taskStatus: "APPROVED", scopeApproved: true, trialCheck: "APPROVED", pay: "RELEASED", assigneeId: "s2", progress: 100, submissionNote: "Survey done; two findings with sourced evidence.", submissionFiles: subAtt("agri") });
  attempt(j8.id, "s2", "SELECTED", 0, trialAtt("agri"));
  point("s2", j8.id, 0, "Selected and delivered the main task — 0");
  evaluate(j8, [4, 4, 4], "Well sourced.", true, "Great work.");

  // J9 — awaiting moderator scope review (c3)
  job({ clientId: "c3", sectorId: "admin", brief: "Digitise 500 paper delivery slips into a clean spreadsheet with agreed columns.", jobStatus: "SCOPING", taskStatus: "OPEN", scopeApproved: true, trialCheck: "AWAITING_CLIENT", pay: "AWAITING", attachments: [fileAtt("slip-sample.md", "text/markdown", "Each slip has: date, route, driver, crates out, crates returned, signature. Some handwriting is faint.")] });

  // J10 — just posted by the demo client: trial to check and escrow to fund (c1)
  job({ clientId: "c1", sectorId: "design", brief: "Photograph our 30 packaging SKUs on a white background with consistent lighting for the website.", jobStatus: "SCOPING", taskStatus: "OPEN", scopeApproved: true, trialCheck: "AWAITING_CLIENT", pay: "AWAITING" });

  // J11 — scored by a moderator, waiting for the demo client's sign-off (c1, s3)
  const j11 = job({ clientId: "c1", sectorId: "content", brief: "Translate our 12-page investor brief into Bangla, keeping the figures and the tone.", jobStatus: "REVIEW", taskStatus: "IN_REVIEW", scopeApproved: true, trialCheck: "APPROVED", pay: "HELD", assigneeId: "s3", progress: 100, submissionNote: "Full Bangla translation attached; two figures in the source did not add up and are flagged in comments.", submissionFiles: subAtt("content") });
  attempt(j11.id, "s3", "SELECTED", 0, trialAtt("content"));
  attempt(j11.id, "s1", "NOT_SHORTLISTED", 1, trialAtt("content"));
  point("s3", j11.id, 0, "Selected — main task in progress");
  point("s1", j11.id, 1, "Did the trial, was not selected — +1");
  evaluate(j11, [4, 5, 4], "Faithful translation; flagged the inconsistent figures instead of correcting them silently.", false, null);

  // Students waiting for verification
  const docs = [
    { label: "Recommendation letter", detail: "Department head, signed and sealed", ok: false },
    { label: "Student ID card", detail: "Valid to 2027", ok: false },
    { label: "Transcript / certificate", detail: "Provisional certificate", ok: false },
    { label: "NID", detail: "Name matches student ID", ok: false },
    { label: "Payout account", detail: "bKash personal", ok: false },
  ];
  for (const sid of ["s4", "s5"]) db.kyc.push({ id: id("k"), subjectId: sid, kind: "STUDENT", status: "PENDING", documents: docs.map((d) => ({ ...d })), note: null, createdAt: at() });
  db.kyc.push({ id: id("k"), subjectId: "s1", kind: "STUDENT", status: "VERIFIED", documents: docs.map((d) => ({ ...d, ok: true })), note: null, createdAt: at() });

  // Support
  db.tickets.push(
    { id: id("tk"), ref: `TKT-${db.seq}`, fromId: "c1", subject: "Change my payout method", body: "How do I switch my default from bKash to bank?", priority: "NORMAL", status: "NEW", reply: null, createdAt: at() },
    { id: id("tk"), ref: `TKT-${db.seq + 1}`, fromId: "s4", subject: "Verification pending", body: "My documents have been pending for a few days.", priority: "HIGH", status: "NEW", reply: null, createdAt: at() }
  );
  db.seq += 1;

  return db;
}

function payNote(status: string) {
  return status === "HELD" ? "Held in escrow until sign-off" : status === "RELEASED" ? "Released on client sign-off" : status === "AWAITING" ? "Awaiting deposit" : "";
}

/** Run the scoping engine on a brief and store the job + its single task, as the server does. */
function buildJob(db: DB, clientId: string, brief: string, opts: { sectorId?: string; budget?: number; title?: string; attachments?: Attachment[] }, createdAt: string) {
  const attText = summarizeAtt(opts.attachments).text;
  const briefForScope = attText ? `${brief}\n\n--- Attached documents ---\n${attText}` : brief;
  const s = scopeOne(briefForScope, { sectorId: opts.sectorId });
  const fee = opts.budget && opts.budget > 0 ? opts.budget : s.task.fee;
  const next = (p: string) => `${p}${++db.seq}`;
  const job: Job = {
    id: next("j"),
    ref: `WB-${db.seq}`,
    clientId,
    title: opts.title?.trim() || s.task.title.en,
    brief,
    sectorId: s.sectorId,
    budget: fee,
    // Stored at once — no approval step. SCOPING = the AI's trial awaits the client's check.
    status: "SCOPING",
    scopeApproved: true,
    aiSummary: s.summary.en,
    aiComplexity: s.complexity,
    aiConfidence: s.confidence,
    aiEstHours: s.task.hours,
    aiSuggestedFee: s.task.fee,
    aiRisks: s.risks.map((r) => r.en),
    aiSkills: s.task.skills,
    attachments: stripBinary(opts.attachments) ?? null,
    createdAt,
  };
  const task: Task = {
    id: next("t"),
    jobId: job.id,
    title: s.task.title.en,
    desc: s.task.desc.en,
    sectorId: s.sectorId,
    fee,
    hours: s.task.hours,
    level: s.task.level.toUpperCase(),
    skills: s.task.skills,
    acceptance: s.task.acceptance.en,
    status: "OPEN",
    assigneeId: null,
    progress: 0,
    submissionNote: null,
    submittedAt: null,
    createdAt,
    updatedAt: createdAt,
    trial: { title: s.trial.title.en, brief: s.trial.brief.en, minutes: s.trial.minutes, mirrors: s.trial.mirrors.en, acceptance: s.trial.acceptance.en, revision: 1, aiNote: null },
    trialCheck: { status: "AWAITING_CLIENT" },
    payment: { id: next("pay"), amount: fee, status: "AWAITING", note: "Awaiting deposit", method: null, clientId, createdAt, updatedAt: createdAt },
    evaluation: null,
  };
  db.jobs.push(job);
  db.tasks.push(task);
  return { job, task, price: priceCheck(fee, task.hours, task.sectorId) };
}

/* ── Persistence ─────────────────────────────────────────────── */

let cache: DB | null = null;

function load(): DB {
  if (cache) return cache;
  try {
    const raw = sessionStorage.getItem(DB_KEY);
    if (raw) cache = JSON.parse(raw) as DB;
  } catch {
    /* corrupt or unavailable — reseed */
  }
  cache ??= seed();
  return cache;
}

function save(db: DB) {
  cache = db;
  try {
    sessionStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    /* keep it in memory */
  }
}

/** Throw away every change made in the demo and start from the seed again. */
export function resetDemoData() {
  cache = null;
  try {
    sessionStorage.removeItem(DB_KEY);
  } catch {
    /* ignore */
  }
}

/* ── Helpers ─────────────────────────────────────────────────── */

const now = () => new Date().toISOString();
const byNewest = <T extends { createdAt: string }>(a: T, b: T) => b.createdAt.localeCompare(a.createdAt);
const fail = (status: number, message: string): never => {
  throw new ApiError(status, message);
};

function sector(id: string) {
  return { id, name: sectorById(id).name.en, rateFloor: RATE_FLOOR[id] ?? 300 };
}

function mini(db: DB, userId: string | null) {
  const u = db.users.find((x) => x.id === userId);
  return u ? { id: u.id, name: u.name, role: u.role } : null;
}

function jobOf(db: DB, task: Task) {
  return db.jobs.find((j) => j.id === task.jobId)!;
}

function taskById(db: DB, taskId: string) {
  return db.tasks.find((t) => t.id === taskId) ?? fail(404, "Task not found");
}

function touch(task: Task) {
  task.updatedAt = now();
}

/**
 * Posting needs no approval: a task goes live on the board as soon as the
 * client approves the AI's trial. Escrow gates SELECTION, not going live.
 */
function maybeActivate(db: DB, task: Task) {
  const job = jobOf(db, task);
  if (task.status === "OPEN" && job.status !== "CANCELLED" && task.trialCheck.status === "APPROVED") {
    task.status = "MATCHING";
    job.status = "MATCHING";
    touch(task);
  }
}

/* ── Uploaded deliverables (metadata + extracted text) ─────────── */
// The SAME builders and scoring the server seed and engine use, so demo and
// real judge an upload identically.
const uf = (name: string, mime: string, content: string): UploadedFile => ({ name, mime, size: content.length, content });
const fileAtt = (name: string, mime: string, content: string): Attachment => ({ kind: "file", name, files: [uf(name, mime, content)] });
const folderAtt = (name: string, files: UploadedFile[]): Attachment => ({ kind: "folder", name, files });
const trialAtt = (sector: string): Attachment[] => {
  switch (sector) {
    case "it": return [folderAtt("trial-checkout", [uf("repro.md", "text/markdown", "# Repro\n1. Add item to cart\n2. Go to checkout\n3. Pay — fails at the callback.\nStep 3 would not reproduce on staging, so I flagged it rather than inventing a cause."), uf("callback.patch.txt", "text/plain", "- res.redirect(cb)\n+ if (!verifySignature(req)) return res.status(400);\n+ res.redirect(cb);")])];
    case "biz": return [fileAtt("reconcile-week1.csv", "text/csv", "date,ref,amount,matched\n01-03,INV-88,12000,yes\n02-03,INV-89,8400,no\n03-03,INV-90,5100,no\n# 2 entries would not reconcile — listed as exceptions, not forced.")];
    case "admin": return [fileAtt("records-12.csv", "text/csv", "id,name,phone\n1,Rahim,017xxxxxxxx\n2,Karim,\n3,[illegible],018xxxxxxxx\n# rows 2 and 3 unclear — flagged, not guessed.")];
    case "design": return [fileAtt("label-two-sizes.md", "text/markdown", "Laid the label out at two sizes. Prices kept in a SEPARATE editable layer — need the final price list confirmed before export.")];
    // J4's live round: two strong attempts (AI-shortlisted, ranked) and one below the bar.
    case "design-strong": return [folderAtt("label-redesign", [
      { name: "label-redesign/label-a6.png", mime: "image/png", size: 248000, content: null },
      { name: "label-redesign/label-a7.png", mime: "image/png", size: 176000, content: null },
      uf("label-redesign/label-source.svg", "image/svg+xml", "<svg xmlns='http://www.w3.org/2000/svg' width='105mm' height='148mm'>\n<g id='artwork'><text>Nokshi Threads — hand-embroidered cushion cover</text></g>\n<g id='prices' data-editable='true'><text id='price'>৳1,450</text></g>\n</svg>"),
      uf("label-redesign/NOTES.md", "text/markdown", "# Packaging label redesign\nTwo sizes exported: A6 (105x148mm) and A7 (74x105mm), both from the same editable source file.\nPrices sit in their own layer (`prices`) so they can change without touching the artwork.\n## Flagged\nThe current price list has two prices for the cushion cover (৳1,450 on the tag, ৳1,500 on the site) — I left the layer editable and need the client to confirm which is right instead of guessing."),
    ])];
    case "design-good": return [folderAtt("label-v1", [
      { name: "label-v1/label-large.png", mime: "image/png", size: 210000, content: null },
      { name: "label-v1/label-small.png", mime: "image/png", size: 150000, content: null },
      { name: "label-v1/label.fig", mime: "application/octet-stream", size: 820000, content: null },
      uf("label-v1/readme.txt", "text/plain", "Packaging label redesigned at two sizes (large and small), exported as PNG from the editable Figma source.\nThe prices are in a separate layer named Prices so they stay editable.\nQuestion: which font should the brand name use? I kept the old one for now."),
    ])];
    case "design-weak": return [{ kind: "file", name: "label.png", files: [{ name: "label.png", mime: "image/png", size: 0, content: null }] }];
    case "content": return [fileAtt("entries.md", "text/markdown", "Three product descriptions in the site's voice.\nNote: item 2's name differs between the tag and the site — asking rather than choosing.")];
    case "agri": return [fileAtt("findings.md", "text/markdown", "Two findings from one season of the sample. Evidence is thin for finding 2, so I stated where I am unsure.")];
    default: return [fileAtt("trial-notes.md", "text/markdown", "Did the sample and flagged the one item that did not add up instead of guessing.")];
  }
};
const subAtt = (sector: string): Attachment[] => {
  switch (sector) {
    case "it": return [folderAtt("checkout-fix", [uf("gateway-callback.js", "text/javascript", "// verify the gateway signature before redirecting the customer\nexport function handleCallback(req, res) { /* ... */ }"), uf("REPRO.md", "text/markdown", "Steps to reproduce the original failure and how the fix resolves it."), uf("before-after.log", "text/plain", "before: HTTP 500 at /callback\nafter: HTTP 200 OK, order marked paid")])];
    case "biz": return [folderAtt("reconciliation", [uf("reconciliation.csv", "text/csv", "date,ref,amount,matched\n... full quarter reconciled ..."), uf("exceptions.md", "text/markdown", "Two entries flagged as exceptions with a note on why each could not be matched.")])];
    case "admin": return [fileAtt("records-800.csv", "text/csv", "id,name,phone,address\n... 800 rows into the agreed columns ...\n# illegible source records flagged, not guessed.")];
    case "agri": return [folderAtt("field-survey", [uf("survey-200.csv", "text/csv", "farmer,upazila,crop,yield\n... 200 responses ..."), uf("findings.md", "text/markdown", "Two findings, each sourced to the sample rows that support it.")])];
    case "content": return [folderAtt("bangla-translation", [uf("investor-brief-bn.md", "text/markdown", "Full Bangla translation, figures and tone preserved."), uf("flagged-figures.md", "text/markdown", "Two figures in the source did not add up — flagged, not silently corrected.")])];
    default: return [fileAtt("deliverable.md", "text/markdown", "Work delivered as agreed against the acceptance criteria.")];
  }
};

function summarizeAtt(atts?: Attachment[] | null) {
  const list = Array.isArray(atts) ? atts : [];
  let text = "";
  for (const a of list) for (const f of a.files ?? []) if (f.content && text.length < 20000) text += (text ? "\n\n" : "") + f.content;
  return { text: text.slice(0, 20000) };
}

/** The base64 image/PDF data is for the AI judge only — never stored. */
function stripBinary(atts?: Attachment[] | null): Attachment[] | undefined {
  if (!Array.isArray(atts)) return undefined;
  return atts.map((a) => ({ kind: a.kind, name: a.name, files: (a.files ?? []).map((f) => ({ name: f.name, mime: f.mime, size: f.size, content: f.content ?? null })) }));
}

/** Re-rank a task's AI shortlist (completion, then quality, then who finished first). */
function rerank(db: DB, taskId: string) {
  const list = rankAttempts(db.attempts.filter((x) => x.taskId === taskId && x.outcome === "SHORTLISTED"));
  list.forEach((x, i) => (x.rank = i + 1));
}

/* ── Views (same shapes as the server's Prisma includes) ─────── */

const taskFull = (db: DB, t: Task) => ({
  ...t,
  // Counts only — who applied stays with the moderator until one is selected.
  trialStats: {
    applicants: db.attempts.filter((a) => a.taskId === t.id).length,
    shortlisted: db.attempts.filter((a) => a.taskId === t.id && (a.outcome === "SHORTLISTED" || a.outcome === "SELECTED")).length,
  },
  sector: sector(t.sectorId),
  assignee: mini(db, t.assigneeId),
  // Matches the server's jobDetailInclude: only the SELECTED attempt, with a {id,name} student.
  attempts: db.attempts
    .filter((a) => a.taskId === t.id && a.outcome === "SELECTED")
    .map((a) => {
      const s = db.users.find((u) => u.id === a.studentId);
      return { ...a, student: s ? { id: s.id, name: s.name } : null };
    }),
});
const jobFull = (db: DB, j: Job) => ({
  ...j,
  sector: sector(j.sectorId),
  client: mini(db, j.clientId),
  tasks: db.tasks.filter((t) => t.jobId === j.id).map((t) => taskFull(db, t)),
});
const boardTask = (db: DB, t: Task) => {
  const j = jobOf(db, t);
  return { ...t, sector: sector(t.sectorId), job: { id: j.id, ref: j.ref, brief: j.brief, clientId: j.clientId } };
};
const taskRef = (db: DB, taskId: string) => {
  const t = db.tasks.find((x) => x.id === taskId);
  return t ? { id: t.id, title: t.title, status: t.status } : null;
};

/* ── Request router ──────────────────────────────────────────── */

type Body = Record<string, any>;

export async function demoRequest<T>(method: string, fullPath: string, body: unknown, role: Role, userId: string): Promise<T> {
  // A short pause so loading states behave as they do against the real API.
  await new Promise((r) => setTimeout(r, 120));
  const db = load();
  const [path, qs] = fullPath.split("?");
  const query = new URLSearchParams(qs ?? "");
  const b = (body ?? {}) as Body;
  const seg = path.split("/").filter(Boolean);
  const result = route(db, method, seg, query, b, role, userId);
  save(db);
  // Hand back a copy, so the UI can never mutate the store by accident.
  return JSON.parse(JSON.stringify(result ?? null)) as T;
}

function route(db: DB, method: string, seg: string[], query: URLSearchParams, b: Body, role: Role, me: string): unknown {
  const [area, a1, a2, a3] = seg;
  const is = (m: string, ...parts: (string | null)[]) =>
    method === m && parts.length === seg.length && parts.every((p, i) => p === null || p === seg[i]);

  if (is("GET", "users", "me")) {
    const u = db.users.find((x) => x.id === me)!;
    return { id: u.id, email: u.email, role: u.role, name: u.name, phone: u.phone, avatarUrl: u.avatarUrl ?? null };
  }
  if (is("PATCH", "users", "me", "avatar")) {
    const u = db.users.find((x) => x.id === me)!;
    u.avatarUrl = String(b.avatarUrl ?? "");
    return { id: u.id, email: u.email, role: u.role, name: u.name, phone: u.phone, avatarUrl: u.avatarUrl };
  }
  if (area === "auth") fail(400, "You are in the live demo — exit the demo to sign in or register.");

  const need = (r: Role) => {
    if (role !== r) fail(403, "This demo account cannot do that");
  };

  /* Client */
  if (area === "client") {
    need("CLIENT");
    const owned = (taskId: string) => {
      const t = taskById(db, taskId);
      if (jobOf(db, t).clientId !== me) fail(403, "This task belongs to another client");
      return t;
    };
    if (is("POST", "client", "jobs")) {
      const brief = String(b.brief ?? "").trim();
      if (brief.length < 10) fail(400, "Describe the problem in at least a sentence");
      const attachments = Array.isArray(b.attachments) ? (b.attachments as Attachment[]) : undefined;
      const { job, price } = buildJob(db, me, brief, { budget: Number(b.budget) || undefined, title: b.title, attachments }, now());
      return { job: jobFull(db, job), price: { ...price, message: price.message.en } };
    }
    if (is("GET", "client", "jobs")) return db.jobs.filter((j) => j.clientId === me).sort(byNewest).map((j) => jobFull(db, j));
    if (is("GET", "client", "jobs", null)) {
      const j = db.jobs.find((x) => x.id === a2) ?? fail(404, "Job not found");
      if (j.clientId !== me) fail(403, "This job belongs to another client");
      return jobFull(db, j);
    }
    if (is("POST", "client", "tasks", null, "trial-check")) {
      const t = owned(a2);
      if (t.trialCheck.status === "APPROVED") fail(409, "The trial has already been approved");
      if (t.status === "CANCELLED") fail(409, "This task was cancelled");
      if (b.decision === "approve") {
        t.trialCheck = { status: "APPROVED" };
        maybeActivate(db, t); // the client's approval alone puts it live on the board
        touch(t);
        return { ...t.trialCheck, live: true };
      }
      const note = String(b.note ?? "").trim();
      if (note.length < 3) fail(400, "Say what the trial should test instead");
      // The AI rebuilds the trial with the note as a requirement, then hands it back.
      const j = jobOf(db, t);
      const docs = summarizeAtt(j.attachments).text;
      const rebuilt = buildTrial({ hours: t.hours } as Parameters<typeof buildTrial>[0], t.sectorId, docs ? `${j.brief}\n\n--- Attached documents ---\n${docs}` : j.brief, note);
      t.trial = {
        title: rebuilt.title.en,
        brief: rebuilt.brief.en,
        minutes: rebuilt.minutes,
        mirrors: rebuilt.mirrors.en,
        acceptance: rebuilt.acceptance.en,
        revision: (t.trial.revision ?? 1) + 1,
        aiNote: `Rebuilt from the client's note: ${note}`,
      };
      t.trialCheck = { status: "AWAITING_CLIENT", clientNote: note };
      touch(t);
      return { ...t.trialCheck, trial: t.trial, rebuilt: true };
    }
    if (is("POST", "client", "tasks", null, "deposit")) {
      const t = owned(a2);
      if (t.payment.status !== "AWAITING") fail(409, "This task's escrow is not awaiting a deposit");
      const price = priceCheck(t.fee, t.hours, t.sectorId);
      if (price.level === "blocked") fail(400, `Cannot fund an underpriced task. ${price.message.en}`);
      const pm = db.methods.find((m) => m.id === b.paymentMethodId && m.clientId === me);
      Object.assign(t.payment, { status: "HELD", method: pm?.label ?? "Escrow deposit", note: "Held in escrow until sign-off", updatedAt: now() });
      touch(t);
      return { payment: t.payment, fairPrice: { ...price, message: price.message.en } };
    }
    if (is("POST", "client", "tasks", null, "signoff")) {
      const t = owned(a2);
      if (!t.evaluation) fail(400, "There is nothing to sign off yet");
      if (t.payment.status !== "HELD") fail(409, "No escrow is held for this task");
      const ev = t.evaluation!;
      if (b.decision === "revision") {
        t.status = "REVISION";
        Object.assign(ev, { clientSignoff: false, clientNote: b.note ?? null });
        touch(t);
        return { released: false, message: "Revision requested; escrow stays held" };
      }
      Object.assign(ev, { clientSignoff: true, clientNote: b.note ?? null });
      Object.assign(t.payment, { status: "RELEASED", note: "Released on client sign-off", updatedAt: now() });
      t.status = "APPROVED";
      jobOf(db, t).status = "DELIVERED";
      touch(t);
      if (t.assigneeId) {
        const reason = "Selected and delivered the main task — 0";
        db.attempts.filter((x) => x.taskId === t.id && x.studentId === t.assigneeId && x.outcome === "SELECTED").forEach((x) => Object.assign(x, { points: 0, pointsReason: reason }));
        db.points.push({ id: `p${++db.seq}`, studentId: t.assigneeId, taskId: t.id, delta: 0, reason, createdAt: now() });
      }
      return { released: true, message: "Work accepted; escrow released to the student" };
    }
    if (is("POST", "client", "tasks", null, "dispute")) return raiseDispute(db, owned(a2), me, "CLIENT", b);
    if (is("GET", "client", "payments"))
      return db.tasks
        .filter((t) => t.payment.clientId === me)
        .map((t) => ({ ...t.payment, taskId: t.id, task: taskRef(db, t.id) }))
        .sort(byNewest);
    if (is("GET", "client", "payment-methods")) return db.methods.filter((m) => m.clientId === me).sort(byNewest);
    if (is("POST", "client", "payment-methods")) {
      if (!String(b.label ?? "").trim()) fail(400, "Give the payment method a label");
      const m: Method = { id: `pm${++db.seq}`, clientId: me, kind: String(b.kind), label: String(b.label), isDefault: !!b.isDefault, createdAt: now() };
      db.methods.push(m);
      return m;
    }
    if (a1 === "tasks" && a3 === "messages") return messages(db, method, owned(a2), me, "CLIENT", b);
  }

  /* Student */
  if (area === "student") {
    need("STUDENT");
    const u = db.users.find((x) => x.id === me)!;
    const profile = u.studentProfile!;
    const assigned = (taskId: string) => {
      const t = taskById(db, taskId);
      if (t.assigneeId !== me) fail(403, "This task is not assigned to you");
      return t;
    };
    if (is("GET", "student", "profile")) return { id: u.id, name: u.name, email: u.email, phone: u.phone, studentProfile: profile };
    if (is("PATCH", "student", "profile")) return Object.assign(profile, b);
    if (is("GET", "student", "kyc")) {
      const submission = db.kyc.filter((k) => k.subjectId === me).sort(byNewest)[0] ?? null;
      return { status: profile.kycStatus, submission };
    }
    if (is("POST", "student", "kyc")) {
      const open = db.kyc.find((k) => k.subjectId === me && (k.status === "PENDING" || k.status === "VERIFIED"));
      if (open) fail(409, open.status === "VERIFIED" ? "You are already verified" : "A verification is already pending review");
      const docs = Array.isArray(b.documents) ? b.documents : [];
      const k: Kyc = { id: `k${++db.seq}`, subjectId: me, kind: "STUDENT", status: "PENDING", documents: docs.map((d: Body) => ({ label: String(d.label), detail: String(d.detail), ok: false })), note: null, createdAt: now() };
      db.kyc.push(k);
      return k;
    }
    if (is("GET", "student", "tasks")) {
      const sectorId = query.get("sectorId");
      return db.tasks
        .filter((t) => t.status === "MATCHING" && t.trialCheck.status === "APPROVED" && (!sectorId || t.sectorId === sectorId))
        .sort(byNewest)
        .map((t) => ({ ...boardTask(db, t), applied: db.attempts.some((x) => x.taskId === t.id && x.studentId === me) }));
    }
    if (is("GET", "student", "tasks", null)) return boardTask(db, taskById(db, a2));
    if (is("POST", "student", "tasks", null, "apply")) {
      if (profile.kycStatus !== "VERIFIED") fail(403, "Your account must be verified before you can do a trial");
      const t = taskById(db, a2);
      if (t.status !== "MATCHING" || t.trialCheck.status !== "APPROVED") fail(400, "This task is not open for applications");
      if (db.attempts.some((x) => x.taskId === t.id && x.studentId === me)) fail(409, "You have already applied to this task");
      const summary = String(b.summary ?? "");
      const minutesTaken = Number(b.minutesTaken) || t.trial.minutes;
      const attachments = Array.isArray(b.attachments) ? (b.attachments as Attachment[]) : undefined;
      // The AI judges the upload against every requirement of the TRIAL.
      const peers = db.attempts.filter((x) => x.taskId === t.id).map((x) => summarizeAtt(x.attachments).text).filter(Boolean);
      const ev = judgeAttempt({ trialTitle: t.trial.title, trialBrief: t.trial.brief, requirements: t.trial.acceptance, trialMinutes: t.trial.minutes, summary, minutesTaken, attachments, taskAcceptance: t.acceptance, peers });
      const at: Attempt = {
        id: `a${++db.seq}`,
        taskId: t.id,
        studentId: me,
        summary,
        minutesTaken,
        attachments: stripBinary(attachments),
        aiScore: ev.score,
        completion: ev.completion,
        checklist: ev.checklist,
        aiFlags: ev.flags,
        aiSource: ev.source,
        aiVerdict: ev.verdict,
        aiCoaching: ev.coaching,
        outcome: ev.shortlisted ? "SHORTLISTED" : "NOT_SHORTLISTED",
        points: 0,
        pointsReason: null,
        rank: null,
        submittedAt: now(),
      };
      db.attempts.push(at);
      rerank(db, t.id);
      touch(t);
      return { ...at, rank: at.rank ?? 0, shortlisted: ev.shortlisted, bar: SHORTLIST_BAR, breakdown: ev.breakdown };
    }
    if (is("GET", "student", "trials"))
      return db.attempts
        .filter((x) => x.studentId === me)
        .sort((x, y) => y.submittedAt.localeCompare(x.submittedAt))
        .map((x) => ({ ...x, task: taskRef(db, x.taskId) }));
    if (is("GET", "student", "points")) {
      const entries = db.points.filter((p) => p.studentId === me).sort(byNewest).map((p) => ({ ...p, task: taskRef(db, p.taskId) }));
      return { total: entries.reduce((s, p) => s + p.delta, 0), entries };
    }
    if (is("GET", "student", "active"))
      return db.tasks
        .filter((t) => t.assigneeId === me && ["IN_PROGRESS", "REVISION", "IN_REVIEW"].includes(t.status))
        .sort((x, y) => y.updatedAt.localeCompare(x.updatedAt))
        .map((t) => {
          const j = jobOf(db, t);
          return { ...t, sector: sector(t.sectorId), job: { ref: j.ref, brief: j.brief } };
        });
    if (is("POST", "student", "tasks", null, "progress")) {
      const t = assigned(a2);
      t.progress = Math.max(0, Math.min(100, Math.round(Number(b.progress) || 0)));
      touch(t);
      return t;
    }
    if (is("POST", "student", "tasks", null, "submit")) {
      const t = assigned(a2);
      if (t.status !== "IN_PROGRESS" && t.status !== "REVISION") fail(400, "This task is not in a state you can submit");
      Object.assign(t, { status: "IN_REVIEW", progress: 100, submissionNote: String(b.note ?? ""), submissionFiles: Array.isArray(b.files) ? stripBinary(b.files as Attachment[]) : t.submissionFiles ?? null, submittedAt: now() });
      touch(t);
      return t;
    }
    if (is("GET", "student", "record"))
      return db.tasks
        .filter((t) => t.assigneeId === me && t.status === "APPROVED")
        .sort((x, y) => y.updatedAt.localeCompare(x.updatedAt))
        .map((t) => {
          const j = jobOf(db, t);
          return { ...t, sector: sector(t.sectorId), job: { ref: j.ref, clientId: j.clientId } };
        });
    if (is("GET", "student", "earnings")) {
      const payments = db.tasks
        .filter((t) => t.assigneeId === me && t.payment.status === "RELEASED")
        .map((t) => ({ ...t.payment, taskId: t.id, task: { id: t.id, title: t.title } }));
      return { total: payments.reduce((s, p) => s + p.amount, 0), payments };
    }
    if (is("POST", "student", "tasks", null, "dispute")) return raiseDispute(db, assigned(a2), me, "STUDENT", b);
    if (a1 === "tasks" && a3 === "messages") return messages(db, method, assigned(a2), me, "STUDENT", b);
  }

  /* Moderator */
  if (area === "moderator") {
    need("MODERATOR");
    // Posted problems whose AI trial still waits for the client — oversight, not approval.
    if (is("GET", "moderator", "scopes"))
      return db.jobs
        .filter((j) => j.status === "SCOPING")
        .sort((x, y) => x.createdAt.localeCompare(y.createdAt))
        .map((j) => jobFull(db, j));
    if (is("POST", "moderator", "scopes", null, "approve")) {
      const j = db.jobs.find((x) => x.id === a2) ?? fail(404, "Job not found");
      if (j.status === "CANCELLED") fail(409, "This problem was cancelled");
      const jt = db.tasks.filter((x) => x.jobId === j.id);
      if ((b.fee || b.hours) && jt.some((t) => t.payment.status !== "AWAITING" || db.attempts.some((x) => x.taskId === t.id)))
        fail(409, "The price can only change before it is funded and before anyone applies");
      j.scopeApproved = true;
      if (b.summary) j.aiSummary = String(b.summary);
      // Re-scoping edits the job's AI figures too, exactly as the server does.
      if (b.hours) j.aiEstHours = Number(b.hours);
      if (b.fee) {
        j.aiSuggestedFee = Number(b.fee);
        j.budget = Number(b.fee);
      }
      for (const t of db.tasks.filter((x) => x.jobId === j.id)) {
        if (b.fee) {
          t.fee = Number(b.fee);
          t.payment.amount = t.fee;
        }
        if (b.hours) t.hours = Number(b.hours);
        maybeActivate(db, t);
      }
      // The server returns the job with its tasks (no client/sector); match that shape.
      return { ...j, tasks: db.tasks.filter((t) => t.jobId === j.id) };
    }
    if (is("POST", "moderator", "scopes", null, "reject")) {
      const j = db.jobs.find((x) => x.id === a2) ?? fail(404, "Job not found");
      j.status = "CANCELLED";
      for (const t of db.tasks.filter((x) => x.jobId === j.id)) {
        t.status = "CANCELLED";
        Object.assign(t.payment, { status: t.payment.status === "HELD" ? "REFUNDED" : "FAILED", note: `Scope rejected: ${b.reason ?? ""}`, updatedAt: now() });
        touch(t);
      }
      return { rejected: true, reason: b.reason };
    }
    // Only the AI shortlist (90%+ completion) reaches the moderator, in rank order.
    if (is("GET", "moderator", "select"))
      return db.tasks
        .filter((t) => t.status === "MATCHING" && db.attempts.some((x) => x.taskId === t.id && x.outcome === "SHORTLISTED"))
        .sort((x, y) => y.updatedAt.localeCompare(x.updatedAt))
        .map((t) => {
          const j = jobOf(db, t);
          const all = db.attempts.filter((x) => x.taskId === t.id);
          const shortlist = all.filter((x) => x.outcome === "SHORTLISTED").sort((x, y) => (x.rank ?? 99) - (y.rank ?? 99));
          return {
            ...t,
            job: { ...j, client: mini(db, j.clientId) },
            attempts: shortlist.map((x) => ({ ...x, student: mini(db, x.studentId) })),
            belowBar: all.length - shortlist.length,
            bar: SHORTLIST_BAR,
            funded: t.payment.status === "HELD",
          };
        });
    if (is("POST", "moderator", "tasks", null, "select")) {
      const t = taskById(db, a2);
      if (t.status !== "MATCHING") fail(409, "This task is not awaiting selection");
      const all = db.attempts.filter((x) => x.taskId === t.id);
      const chosen = all.find((x) => x.studentId === b.studentId) ?? fail(400, "That student did not do this trial");
      if (chosen.outcome !== "SHORTLISTED") fail(400, `Only students the AI shortlisted (${SHORTLIST_BAR}%+ completion) can be selected`);
      if (t.payment.status !== "HELD") fail(409, "The client has not funded the escrow yet — a student can be assigned once the fee is held");
      Object.assign(t, { assigneeId: chosen.studentId, status: "IN_PROGRESS" });
      jobOf(db, t).status = "ACTIVE";
      touch(t);
      Object.assign(chosen, { outcome: "SELECTED", rank: 1, points: 0, pointsReason: "Selected — main task in progress (0 until delivered)" });
      db.points.push({ id: `p${++db.seq}`, studentId: chosen.studentId, taskId: t.id, delta: 0, reason: "Selected — main task in progress", createdAt: now() });
      const others = all.filter((x) => x !== chosen);
      for (const o of others) {
        Object.assign(o, { outcome: "NOT_SHORTLISTED", points: 1, pointsReason: "Did the trial, was not selected — +1" });
        db.points.push({ id: `p${++db.seq}`, studentId: o.studentId, taskId: t.id, delta: 1, reason: "Did the trial, was not selected — +1", createdAt: now() });
      }
      return { taskId: t.id, selected: chosen.studentId, reason: b.reason, creditedOthers: others.length };
    }
    if (is("GET", "moderator", "reviews"))
      return db.tasks
        .filter((t) => t.status === "IN_REVIEW" && !t.evaluation)
        .sort((x, y) => (x.submittedAt ?? "").localeCompare(y.submittedAt ?? ""))
        .map((t) => {
          const j = jobOf(db, t);
          return { ...t, assignee: mini(db, t.assigneeId), job: { ref: j.ref, clientId: j.clientId } };
        });
    if (is("POST", "moderator", "tasks", null, "score")) {
      const t = taskById(db, a2);
      if (!t.assigneeId) fail(400, "No student is assigned to this task");
      if (t.status !== "IN_REVIEW") fail(409, "This task is not awaiting scoring");
      t.evaluation = { id: `e${++db.seq}`, taskId: t.id, studentId: t.assigneeId, reviewerId: me, scores: b.scores ?? [], reviewerNote: String(b.note ?? ""), clientSignoff: false, clientNote: null };
      touch(t);
      return t.evaluation;
    }
    if (is("GET", "moderator", "kyc"))
      return db.kyc
        .filter((k) => k.status === "PENDING")
        .sort((x, y) => x.createdAt.localeCompare(y.createdAt))
        .map((k) => {
          const s = db.users.find((u) => u.id === k.subjectId)!;
          return { ...k, subject: { id: s.id, name: s.name, email: s.email } };
        });
    if (is("POST", "moderator", "kyc", null)) {
      const k = db.kyc.find((x) => x.id === a2) ?? fail(404, "Submission not found");
      const profile = db.users.find((u) => u.id === k.subjectId)?.studentProfile;
      if (b.decision === "approve") {
        Object.assign(k, { status: "VERIFIED", note: b.note ?? null, documents: k.documents.map((d) => ({ ...d, ok: true })) });
        if (profile) profile.kycStatus = "VERIFIED";
      } else {
        Object.assign(k, { status: b.decision === "reject" ? "REJECTED" : "RESUBMIT", note: b.note ?? null });
        if (profile) profile.kycStatus = b.decision === "reject" ? "REJECTED" : "PENDING";
      }
      return { status: k.status };
    }
    if (is("GET", "moderator", "payments"))
      return db.tasks
        .map((t) => ({ ...t.payment, taskId: t.id, task: taskRef(db, t.id), client: mini(db, t.payment.clientId) }))
        .sort((x, y) => y.updatedAt.localeCompare(x.updatedAt));
    if (is("POST", "moderator", "tasks", null, "refund")) {
      const t = taskById(db, a2);
      if (t.payment.status !== "HELD") fail(409, "Only held escrow can be refunded");
      Object.assign(t.payment, { status: "REFUNDED", note: `Refunded: ${b.reason ?? ""}`, updatedAt: now() });
      t.status = "CANCELLED";
      touch(t);
      return t.payment;
    }
    if (is("GET", "moderator", "disputes")) {
      const status = query.get("status");
      return db.disputes
        .filter((d) => !status || d.status === status)
        .sort(byNewest)
        .map((d) => {
          const t = db.tasks.find((x) => x.id === d.taskId);
          return { ...d, task: t ? { id: t.id, title: t.title, assigneeId: t.assigneeId } : null, raisedBy: mini(db, d.raisedById) };
        });
    }
    if (is("POST", "moderator", "disputes", null, "rule")) {
      const d = db.disputes.find((x) => x.id === a2) ?? fail(404, "Dispute not found");
      if (d.status === "RESOLVED") fail(409, "Dispute already resolved");
      const outcome = b.outcome === "client" ? "Refunded to the client" : b.outcome === "student" ? "Released to the student" : "Split for partial delivery";
      Object.assign(d, { status: "RESOLVED", outcome, resolution: String(b.resolution ?? "") });
      const t = taskById(db, d.taskId);
      Object.assign(t.payment, { status: b.outcome === "client" ? "REFUNDED" : "RELEASED", note: `Dispute ${d.ref}: ${outcome}`, updatedAt: now() });
      if (t.assigneeId && b.outcome === "client") {
        db.attempts.filter((x) => x.taskId === t.id && x.studentId === t.assigneeId && x.outcome === "SELECTED").forEach((x) => Object.assign(x, { points: -1, pointsReason: "Selected but did not deliver — -1" }));
        db.points.push({ id: `p${++db.seq}`, studentId: t.assigneeId, taskId: t.id, delta: -1, reason: "Selected but did not deliver the main task — -1", createdAt: now() });
      }
      return { resolved: true, outcome };
    }
    if (is("GET", "moderator", "support")) {
      const status = query.get("status");
      return db.tickets
        .filter((x) => !status || x.status === status)
        .sort((x, y) => (x.priority === y.priority ? y.createdAt.localeCompare(x.createdAt) : x.priority === "HIGH" ? -1 : 1))
        .map((x) => ({ ...x, from: mini(db, x.fromId) }));
    }
    if (is("POST", "moderator", "support", null, "reply")) {
      const x = db.tickets.find((k) => k.id === a2) ?? fail(404, "Ticket not found");
      Object.assign(x, { reply: String(b.reply ?? ""), status: "ANSWERED" });
      return x;
    }
    if (is("GET", "moderator", "users")) {
      const r = query.get("role");
      return db.users
        .filter((u) => !r || u.role === r)
        .sort(byNewest)
        .map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, isActive: u.isActive, createdAt: u.createdAt, clientProfile: u.clientProfile ?? null, studentProfile: u.studentProfile ?? null }));
    }
    if (is("POST", "moderator", "users", null, "active")) {
      const u = db.users.find((x) => x.id === a2) ?? fail(404, "User not found");
      u.isActive = !!b.isActive;
      return { id: u.id, name: u.name, isActive: u.isActive };
    }
    if (is("GET", "moderator", "controls"))
      return {
        rateFloors: RATE_FLOOR,
        shortlistBar: SHORTLIST_BAR,
        rules: [
          { key: "noPostApproval", label: "Posted problems are stored at once — the client approves the AI's trial", locked: true },
          { key: "shortlistBar", label: `AI sends only trial attempts with ${SHORTLIST_BAR}%+ completion to the moderator`, locked: true },
          { key: "fundedBeforeSelection", label: "A student is assigned only once the escrow is funded", locked: true },
          { key: "fairPriceFloor", label: "Fair-price floor (per sector)", locked: true },
          { key: "escrowReleaseOnSignoff", label: "Escrow releases only on client sign-off", locked: true },
          { key: "verifyBeforeTrial", label: "Students must be verified before a trial", locked: true },
          { key: "trialToApply", label: "Applying means doing the trial", locked: true },
        ],
      };
  }

  /* Support (client / student) */
  if (area === "support") {
    if (is("POST", "support")) {
      const x: Ticket = { id: `tk${++db.seq}`, ref: `TKT-${db.seq}`, fromId: me, subject: String(b.subject ?? ""), body: String(b.body ?? ""), priority: b.priority === "high" ? "HIGH" : "NORMAL", status: "NEW", reply: null, createdAt: now() };
      db.tickets.push(x);
      return x;
    }
    if (is("GET", "support")) return db.tickets.filter((x) => x.fromId === me).sort(byNewest);
  }

  return fail(404, `Not available in the demo: ${method} /${seg.join("/")}`);
}

function raiseDispute(db: DB, t: Task, me: string, by: "CLIENT" | "STUDENT", b: Body) {
  if (db.disputes.some((d) => d.taskId === t.id)) fail(409, "A dispute already exists for this task");
  const d: Dispute = { id: `d${++db.seq}`, ref: `DSP-${db.seq}`, taskId: t.id, raisedById: me, raisedByRole: by, status: "OPEN", amount: Number(b.amount) || t.fee, claim: String(b.claim ?? ""), evidence: Array.isArray(b.evidence) ? b.evidence : [], outcome: null, resolution: null, createdAt: now() };
  db.disputes.push(d);
  return d;
}

function messages(db: DB, method: string, t: Task, me: string, role: Role, b: Body) {
  if (method === "GET")
    return db.messages
      .filter((m) => m.taskId === t.id)
      .sort((x, y) => x.createdAt.localeCompare(y.createdAt))
      .map((m) => ({ ...m, author: mini(db, m.authorId) }));
  if (!t.assigneeId) fail(400, "The chat opens once a student has been suggested for this task");
  const m: Message = { id: `msg${++db.seq}`, taskId: t.id, authorId: me, fromRole: role, body: String(b.body ?? ""), createdAt: now() };
  db.messages.push(m);
  return { ...m, author: mini(db, me) };
}
