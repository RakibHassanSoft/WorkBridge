import { Prisma } from "@prisma/client";

// What a student sees when browsing the board: the task, its trial, and its sector.
export const boardTaskInclude = {
  sector: true,
  trial: true,
  job: { select: { id: true, ref: true, brief: true, clientId: true } },
} satisfies Prisma.TaskInclude;

// A KYC document as submitted by the student.
export interface KycDoc {
  label: string;
  detail: string;
  ok: boolean;
}

// The documents a student verification requires. `ok` is false until a
// moderator marks each one cleared (Phase 4).
export const REQUIRED_STUDENT_DOCS: { label: string; key: string }[] = [
  { label: "Recommendation letter", key: "recommendationLetter" },
  { label: "Student ID card", key: "studentId" },
  { label: "Transcript / certificate", key: "transcript" },
  { label: "NID", key: "nid" },
  { label: "Payout account", key: "payoutAccount" },
];
