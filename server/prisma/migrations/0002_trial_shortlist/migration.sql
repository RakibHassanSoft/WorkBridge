-- Catch-up for columns that were added with `prisma db push` after 0001
-- (IF NOT EXISTS keeps this safe on databases that already have them).
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "attachments" JSONB;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "submissionFiles" JSONB;
ALTER TABLE "TrialAttempt" ADD COLUMN IF NOT EXISTS "attachments" JSONB;

-- Trial rebuilds on the client's request.
ALTER TABLE "Trial" ADD COLUMN IF NOT EXISTS "revision" INTEGER NOT NULL DEFAULT 1;

-- AI shortlist: completion %, requirement checklist, integrity flags, judge source.
ALTER TABLE "TrialAttempt" ADD COLUMN IF NOT EXISTS "completion" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "TrialAttempt" ADD COLUMN IF NOT EXISTS "checklist" JSONB;
ALTER TABLE "TrialAttempt" ADD COLUMN IF NOT EXISTS "aiFlags" TEXT[] DEFAULT '{}';
ALTER TABLE "TrialAttempt" ADD COLUMN IF NOT EXISTS "aiSource" TEXT;

-- Posting no longer waits for a moderator: release every scope that was waiting.
UPDATE "Job" SET "scopeApproved" = true WHERE "scopeApproved" = false AND "status" <> 'CANCELLED';
