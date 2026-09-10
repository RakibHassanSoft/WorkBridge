import type { L } from "@/lib/i18n";

export type Sector = {
  id: string;
  name: L;
  tagline: L;
  disciplines: L;
  partners: string[];
  accent: string;
  icon: string;
  openTasks: number;
  avgFee: string;
  rubric: { en: string[]; bn: string[] };
  sampleWork: { en: string[]; bn: string[] };
};

export type Student = {
  id: string;
  slug: string;
  name: L;
  university: L;
  discipline: L;
  sectorIds: string[];
  year: string;
  city: L;
  skills: string[];
  rating: number;
  completed: number;
  onTime: number;
  earned: number;
  verified: number;
  streak: number;
  bio: L;
};

export type Client = {
  id: string;
  name: L;
  industry: L;
  size: L;
  city: L;
  since: string;
  spend: number;
  repeat: number;
};

export type TaskStatus = "matching" | "in_progress" | "in_review" | "revision" | "approved" | "open" | "cancelled";

export type Task = {
  id: string;
  jobId: string;
  seq: number;
  title: L;
  desc: L;
  sectorId: string;
  fee: number;
  hours: number;
  level: "micro" | "standard" | "advanced";
  skills: string[];
  status: TaskStatus;
  assignee?: string;
  progress: number;
  dueLabel: L;
  acceptance: { en: string[]; bn: string[] };
  dependsOn?: string[];
};

export type JobStatus = "draft" | "scoping" | "matching" | "active" | "review" | "delivered";

export type Job = {
  id: string;
  ref: string;
  clientId: string;
  title: L;
  brief: L;
  sectorId: string;
  budget: number;
  postedLabel: L;
  status: JobStatus;
  ai: {
    summary: L;
    complexity: "Low" | "Medium" | "High";
    confidence: number;
    estHours: number;
    suggestedFee: number;
    risks: { en: string[]; bn: string[] };
    skills: string[];
  };
  taskIds: string[];
};

export type RubricScore = { dim: L; score: number; max: number };

export type Evaluation = {
  id: string;
  taskId: string;
  studentId: string;
  reviewerId: string;          // the coordinator who scored it
  scores: RubricScore[];
  reviewerNote: L;
  clientSignoff: boolean;
  clientNote?: L;
  dateLabel: L;
};

export type PassportEntry = {
  id: string;
  title: L;
  client: L;
  sectorId: string;
  dateLabel: L;
  score: number;
  reviewer: L;
  outcome: L;
  skills: string[];
};

/* ── Marketplace layer ────────────────────────────────────────── */

export type TaskMeta = {
  applicants: number;
  postedOrder: number;
  postedLabel: L;
  clientWords: L;
  aiSimple: L;
  aiSteps: { en: string[]; bn: string[] };
  aiWatchOut?: L;
  cancelReason?: L;
  cancelledLabel?: L;
};

export type Applicant = {
  studentId: string;
  matchScore: number;
  pitch: L;
  appliedLabel: L;
  outcome: "selected" | "not_selected" | "pending";
  reason?: L;
};

export type Submission = {
  id: string;
  taskId: string;
  studentId: string;
  outcome: "accepted" | "not_selected";
  headline: L;
  approach: L;
  strengths: { en: string[]; bn: string[] };
  gaps: { en: string[]; bn: string[] };
  score?: number;
  maxScore?: number;
  aiFeedback: L;
};

/* ── Trial task layer ─────────────────────────────────────────── */

/** A small AI-built mirror of the real task. Applying means doing this. */
export type Trial = {
  id: string;
  taskId: string;
  title: L;
  brief: L;
  mirrors: L;          // which part of the real task this copies
  minutes: number;     // how long it should take
  acceptance: { en: string[]; bn: string[] };
  aiNote: L;           // why this trial was chosen as the test
};

export type TrialOutcome = "pending" | "shortlisted" | "not_shortlisted" | "selected";

export type TrialAttempt = {
  id: string;
  trialId: string;
  taskId: string;
  studentId: string;
  submittedLabel: L;
  minutesTaken: number;
  summary: L;                                  // what the student produced
  aiScore: number;                             // 0–100
  aiBreakdown: { dim: L; score: number; max: number }[];
  aiVerdict: L;                                // AI's reasoning, shown to everyone
  aiCoaching: L;                               // private, for this student only
  rank: number;
  outcome: TrialOutcome;
  points: number;                              // +1 / 0 / −1
  pointsReason: L;
};

export type PointEntry = {
  id: string;
  studentId: string;
  taskId: string;
  delta: number;
  reason: L;
  dateLabel: L;
};

/* ── Chat ─────────────────────────────────────────────────────── */

export type ChatMessage = {
  id: string;
  taskId: string;
  from: "client" | "student" | "moderator";
  authorName: L;
  body: L;
  timeLabel: L;
  attachment?: L;
};

/* ── Disputes & support ───────────────────────────────────────── */

export type DisputeStatus = "open" | "evidence" | "resolved";

export type Dispute = {
  id: string;
  ref: string;
  taskId: string;
  raisedBy: "client" | "student";
  raisedByName: L;
  openedLabel: L;
  status: DisputeStatus;
  amount: number;
  claim: L;
  counterClaim: L;
  evidence: { en: string[]; bn: string[] };
  resolution?: L;
  outcome?: L;
};

export type TicketStatus = "new" | "answered" | "closed";

export type SupportTicket = {
  id: string;
  ref: string;
  fromRole: "client" | "student";
  fromName: L;
  subject: L;
  body: L;
  openedLabel: L;
  status: TicketStatus;
  priority: "high" | "normal";
  reply?: L;
};

/* ── Client check on the AI's trial ───────────────────────────

   The AI writes the trial, but the client owns the job. Before a task
   is posted, the client is shown the real task and the AI's small copy
   side by side and asked one question: is this actually a piece of my
   work? Nothing posts until they say yes.
   ──────────────────────────────────────────────────────────── */

export type TrialCheckStatus = "awaiting_client" | "approved" | "changes_asked";

export type TrialCheck = {
  taskId: string;
  status: TrialCheckStatus;
  askedLabel: L;
  decidedLabel?: L;
  clientNote?: L;      // what the client said when asking for a change
};

/** The one person the moderator puts forward to the client. */
export type Suggestion = {
  taskId: string;
  studentId: string;
  attemptId: string;
  reason: L;           // why this one, in the moderator's words
  suggestedLabel: L;
  triedCount: number;  // how many did the trial in total
};
