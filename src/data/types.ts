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

export type Mentor = {
  id: string;
  name: L;
  role: L;
  org: L;
  sectorIds: string[];
  reviews: number;
  avgTurnaround: L;
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
  mentorId: string;
  scores: RubricScore[];
  mentorNote: L;
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
  mentor: L;
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
