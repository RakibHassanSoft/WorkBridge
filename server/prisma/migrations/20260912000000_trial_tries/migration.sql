-- Allow up to two trial attempts per student per task.
-- Idempotent so it is safe whether the database was built with migrate or db push.
ALTER TABLE "TrialAttempt" ADD COLUMN IF NOT EXISTS "tries" INTEGER NOT NULL DEFAULT 1;
