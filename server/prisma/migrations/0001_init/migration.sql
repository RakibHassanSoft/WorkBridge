CREATE TYPE "Role" AS ENUM ('CLIENT', 'STUDENT', 'MODERATOR');
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'SCOPING', 'MATCHING', 'ACTIVE', 'REVIEW', 'DELIVERED', 'CANCELLED');
CREATE TYPE "TaskStatus" AS ENUM ('OPEN', 'MATCHING', 'IN_PROGRESS', 'IN_REVIEW', 'REVISION', 'APPROVED', 'CANCELLED');
CREATE TYPE "TaskLevel" AS ENUM ('MICRO', 'STANDARD', 'ADVANCED');
CREATE TYPE "PayStatus" AS ENUM ('AWAITING', 'HELD', 'RELEASED', 'REFUNDED', 'FAILED');
CREATE TYPE "TrialCheckStatus" AS ENUM ('AWAITING_CLIENT', 'APPROVED', 'CHANGES_ASKED');
CREATE TYPE "TrialOutcome" AS ENUM ('PENDING', 'SHORTLISTED', 'NOT_SHORTLISTED', 'SELECTED');
CREATE TYPE "KycKind" AS ENUM ('STUDENT', 'CLIENT');
CREATE TYPE "KycStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'RESUBMIT');
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'EVIDENCE', 'RESOLVED');
CREATE TYPE "DisputeParty" AS ENUM ('CLIENT', 'STUDENT');
CREATE TYPE "TicketStatus" AS ENUM ('NEW', 'ANSWERED', 'CLOSED');
CREATE TYPE "TicketPriority" AS ENUM ('HIGH', 'NORMAL');
CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "role" "Role" NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  PRIMARY KEY ("id")
);
CREATE TABLE "ClientProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "businessName" TEXT NOT NULL,
  "industry" TEXT,
  "size" TEXT,
  "city" TEXT,
  PRIMARY KEY ("id")
);
CREATE TABLE "StudentProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "university" TEXT,
  "discipline" TEXT,
  "year" TEXT,
  "city" TEXT,
  "skills" TEXT[] DEFAULT '{}',
  "bio" TEXT,
  "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "onTime" INTEGER NOT NULL DEFAULT 0,
  "kycStatus" "KycStatus" NOT NULL DEFAULT 'PENDING',
  PRIMARY KEY ("id")
);
CREATE TABLE "Sector" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "tagline" TEXT,
  "rateFloor" INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY ("id")
);
CREATE TABLE "Job" (
  "id" TEXT NOT NULL,
  "ref" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "brief" TEXT NOT NULL,
  "sectorId" TEXT,
  "budget" INTEGER NOT NULL DEFAULT 0,
  "status" "JobStatus" NOT NULL DEFAULT 'DRAFT',
  "scopeApproved" BOOLEAN NOT NULL DEFAULT false,
  "aiSummary" TEXT,
  "aiComplexity" TEXT,
  "aiConfidence" DOUBLE PRECISION,
  "aiEstHours" INTEGER,
  "aiSuggestedFee" INTEGER,
  "aiRisks" TEXT[] DEFAULT '{}',
  "aiSkills" TEXT[] DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  PRIMARY KEY ("id")
);
CREATE TABLE "Task" (
  "id" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "seq" INTEGER NOT NULL DEFAULT 1,
  "title" TEXT NOT NULL,
  "desc" TEXT NOT NULL,
  "sectorId" TEXT,
  "fee" INTEGER NOT NULL DEFAULT 0,
  "hours" INTEGER NOT NULL DEFAULT 0,
  "level" "TaskLevel" NOT NULL DEFAULT 'STANDARD',
  "skills" TEXT[] DEFAULT '{}',
  "status" "TaskStatus" NOT NULL DEFAULT 'OPEN',
  "progress" INTEGER NOT NULL DEFAULT 0,
  "acceptance" TEXT[] DEFAULT '{}',
  "submissionNote" TEXT,
  "submittedAt" TIMESTAMP(3),
  "assigneeId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  PRIMARY KEY ("id")
);
CREATE TABLE "Trial" (
  "id" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "brief" TEXT NOT NULL,
  "mirrors" TEXT,
  "minutes" INTEGER NOT NULL DEFAULT 30,
  "acceptance" TEXT[] DEFAULT '{}',
  "aiNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);
CREATE TABLE "TrialCheck" (
  "id" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "status" "TrialCheckStatus" NOT NULL DEFAULT 'AWAITING_CLIENT',
  "clientNote" TEXT,
  "decidedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);
CREATE TABLE "TrialAttempt" (
  "id" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "minutesTaken" INTEGER NOT NULL DEFAULT 0,
  "summary" TEXT,
  "aiScore" INTEGER NOT NULL DEFAULT 0,
  "aiVerdict" TEXT,
  "aiCoaching" TEXT,
  "rank" INTEGER NOT NULL DEFAULT 0,
  "outcome" "TrialOutcome" NOT NULL DEFAULT 'PENDING',
  "points" INTEGER NOT NULL DEFAULT 0,
  "pointsReason" TEXT,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);
CREATE TABLE "PointEntry" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "delta" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);
CREATE TABLE "Payment" (
  "id" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "method" TEXT,
  "status" "PayStatus" NOT NULL DEFAULT 'AWAITING',
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  PRIMARY KEY ("id")
);
CREATE TABLE "PaymentMethod" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);
CREATE TABLE "Evaluation" (
  "id" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "reviewerId" TEXT NOT NULL,
  "scores" JSONB NOT NULL,
  "reviewerNote" TEXT,
  "clientSignoff" BOOLEAN NOT NULL DEFAULT false,
  "clientNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);
CREATE TABLE "Dispute" (
  "id" TEXT NOT NULL,
  "ref" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "raisedById" TEXT NOT NULL,
  "raisedByRole" "DisputeParty" NOT NULL,
  "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
  "amount" INTEGER NOT NULL DEFAULT 0,
  "claim" TEXT NOT NULL,
  "counterClaim" TEXT,
  "evidence" TEXT[] DEFAULT '{}',
  "resolution" TEXT,
  "outcome" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  PRIMARY KEY ("id")
);
CREATE TABLE "SupportTicket" (
  "id" TEXT NOT NULL,
  "ref" TEXT NOT NULL,
  "fromId" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "status" "TicketStatus" NOT NULL DEFAULT 'NEW',
  "priority" "TicketPriority" NOT NULL DEFAULT 'NORMAL',
  "reply" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  PRIMARY KEY ("id")
);
CREATE TABLE "ChatMessage" (
  "id" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "fromRole" "Role" NOT NULL,
  "body" TEXT NOT NULL,
  "attachment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);
CREATE TABLE "KycSubmission" (
  "id" TEXT NOT NULL,
  "kind" "KycKind" NOT NULL,
  "subjectId" TEXT NOT NULL,
  "status" "KycStatus" NOT NULL DEFAULT 'PENDING',
  "documents" JSONB NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "User" ADD CONSTRAINT "User_email_key" UNIQUE ("email");
ALTER TABLE "ClientProfile" ADD CONSTRAINT "ClientProfile_userId_key" UNIQUE ("userId");
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_userId_key" UNIQUE ("userId");
ALTER TABLE "Job" ADD CONSTRAINT "Job_ref_key" UNIQUE ("ref");
ALTER TABLE "Trial" ADD CONSTRAINT "Trial_taskId_key" UNIQUE ("taskId");
ALTER TABLE "TrialCheck" ADD CONSTRAINT "TrialCheck_taskId_key" UNIQUE ("taskId");
ALTER TABLE "TrialAttempt" ADD CONSTRAINT "TrialAttempt_taskId_studentId_key" UNIQUE ("taskId", "studentId");
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_taskId_key" UNIQUE ("taskId");
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_taskId_key" UNIQUE ("taskId");
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_ref_key" UNIQUE ("ref");
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_taskId_key" UNIQUE ("taskId");
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_ref_key" UNIQUE ("ref");
ALTER TABLE "ClientProfile" ADD CONSTRAINT "ClientProfile_user_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE;
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_user_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE;
ALTER TABLE "Job" ADD CONSTRAINT "Job_client_fkey" FOREIGN KEY ("clientId") REFERENCES "User" ("id");
ALTER TABLE "Job" ADD CONSTRAINT "Job_sector_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector" ("id");
ALTER TABLE "Task" ADD CONSTRAINT "Task_job_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_sector_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector" ("id");
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignee_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id");
ALTER TABLE "Trial" ADD CONSTRAINT "Trial_task_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE;
ALTER TABLE "TrialCheck" ADD CONSTRAINT "TrialCheck_task_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE;
ALTER TABLE "TrialAttempt" ADD CONSTRAINT "TrialAttempt_task_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE;
ALTER TABLE "TrialAttempt" ADD CONSTRAINT "TrialAttempt_student_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id");
ALTER TABLE "PointEntry" ADD CONSTRAINT "PointEntry_student_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id");
ALTER TABLE "PointEntry" ADD CONSTRAINT "PointEntry_task_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_task_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_client_fkey" FOREIGN KEY ("clientId") REFERENCES "User" ("id");
ALTER TABLE "PaymentMethod" ADD CONSTRAINT "PaymentMethod_client_fkey" FOREIGN KEY ("clientId") REFERENCES "User" ("id") ON DELETE CASCADE;
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_task_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE;
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_student_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id");
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_reviewer_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User" ("id");
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_task_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE;
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_raisedBy_fkey" FOREIGN KEY ("raisedById") REFERENCES "User" ("id");
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_from_fkey" FOREIGN KEY ("fromId") REFERENCES "User" ("id");
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_task_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE;
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_author_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id");
ALTER TABLE "KycSubmission" ADD CONSTRAINT "KycSubmission_subject_fkey" FOREIGN KEY ("subjectId") REFERENCES "User" ("id");
