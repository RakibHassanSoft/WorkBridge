-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CLIENT', 'STUDENT', 'MODERATOR');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'SCOPING', 'MATCHING', 'ACTIVE', 'REVIEW', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('OPEN', 'MATCHING', 'IN_PROGRESS', 'IN_REVIEW', 'REVISION', 'APPROVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskLevel" AS ENUM ('MICRO', 'STANDARD', 'ADVANCED');

-- CreateEnum
CREATE TYPE "PayStatus" AS ENUM ('AWAITING', 'HELD', 'RELEASED', 'REFUNDED', 'FAILED');

-- CreateEnum
CREATE TYPE "TrialCheckStatus" AS ENUM ('AWAITING_CLIENT', 'APPROVED', 'CHANGES_ASKED');

-- CreateEnum
CREATE TYPE "TrialOutcome" AS ENUM ('PENDING', 'SHORTLISTED', 'NOT_SHORTLISTED', 'SELECTED');

-- CreateEnum
CREATE TYPE "KycKind" AS ENUM ('STUDENT', 'CLIENT');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'RESUBMIT');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'EVIDENCE', 'RESOLVED');

-- CreateEnum
CREATE TYPE "DisputeParty" AS ENUM ('CLIENT', 'STUDENT');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('NEW', 'ANSWERED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('HIGH', 'NORMAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "industry" TEXT,
    "size" TEXT,
    "city" TEXT,

    CONSTRAINT "ClientProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "university" TEXT,
    "discipline" TEXT,
    "year" TEXT,
    "city" TEXT,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bio" TEXT,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "onTime" INTEGER NOT NULL DEFAULT 0,
    "kycStatus" "KycStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sector" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "rateFloor" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Sector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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
    "aiRisks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "aiSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "TaskStatus" NOT NULL DEFAULT 'OPEN',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "acceptance" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "submissionNote" TEXT,
    "submissionFiles" JSONB,
    "submittedAt" TIMESTAMP(3),
    "assigneeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trial" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "brief" TEXT NOT NULL,
    "mirrors" TEXT,
    "minutes" INTEGER NOT NULL DEFAULT 30,
    "acceptance" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "aiNote" TEXT,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrialCheck" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "status" "TrialCheckStatus" NOT NULL DEFAULT 'AWAITING_CLIENT',
    "clientNote" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrialCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrialAttempt" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "minutesTaken" INTEGER NOT NULL DEFAULT 0,
    "summary" TEXT,
    "attachments" JSONB,
    "aiScore" INTEGER NOT NULL DEFAULT 0,
    "completion" INTEGER NOT NULL DEFAULT 0,
    "checklist" JSONB,
    "aiFlags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "aiSource" TEXT,
    "aiVerdict" TEXT,
    "aiCoaching" TEXT,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "outcome" "TrialOutcome" NOT NULL DEFAULT 'PENDING',
    "points" INTEGER NOT NULL DEFAULT 0,
    "pointsReason" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrialAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointEntry" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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
    "evidence" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "resolution" TEXT,
    "outcome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "fromRole" "Role" NOT NULL,
    "body" TEXT NOT NULL,
    "attachment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KycSubmission" (
    "id" TEXT NOT NULL,
    "kind" "KycKind" NOT NULL,
    "subjectId" TEXT NOT NULL,
    "status" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "documents" JSONB NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KycSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ClientProfile_userId_key" ON "ClientProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_userId_key" ON "StudentProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Job_ref_key" ON "Job"("ref");

-- CreateIndex
CREATE UNIQUE INDEX "Trial_taskId_key" ON "Trial"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "TrialCheck_taskId_key" ON "TrialCheck"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "TrialAttempt_taskId_studentId_key" ON "TrialAttempt"("taskId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_taskId_key" ON "Payment"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "Evaluation_taskId_key" ON "Evaluation"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "Dispute_ref_key" ON "Dispute"("ref");

-- CreateIndex
CREATE UNIQUE INDEX "Dispute_taskId_key" ON "Dispute"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "SupportTicket_ref_key" ON "SupportTicket"("ref");

-- AddForeignKey
ALTER TABLE "ClientProfile" ADD CONSTRAINT "ClientProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trial" ADD CONSTRAINT "Trial_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrialCheck" ADD CONSTRAINT "TrialCheck_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrialAttempt" ADD CONSTRAINT "TrialAttempt_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrialAttempt" ADD CONSTRAINT "TrialAttempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointEntry" ADD CONSTRAINT "PointEntry_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointEntry" ADD CONSTRAINT "PointEntry_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMethod" ADD CONSTRAINT "PaymentMethod_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_raisedById_fkey" FOREIGN KEY ("raisedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KycSubmission" ADD CONSTRAINT "KycSubmission_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
