-- CreateEnum
CREATE TYPE "PromotionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Pod" ADD COLUMN     "lastActivityAt" TIMESTAMP(3),
ADD COLUMN     "parentPodId" TEXT,
ADD COLUMN     "spawnedByUserId" TEXT;

-- CreateTable
CREATE TABLE "Drill" (
    "id" TEXT NOT NULL,
    "podId" TEXT NOT NULL,
    "startedById" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "windowMinutes" INTEGER NOT NULL,
    "eligibleCount" INTEGER NOT NULL,
    "closedAt" TIMESTAMP(3),
    "respondedCount" INTEGER NOT NULL DEFAULT 0,
    "passed" BOOLEAN,

    CONSTRAINT "Drill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrillResponse" (
    "id" TEXT NOT NULL,
    "drillId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "respondedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "secondsToRespond" INTEGER NOT NULL,

    CONSTRAINT "DrillResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaptainStatus" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "podId" TEXT,
    "level" INTEGER,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedLevel" INTEGER,
    "lapseStartedAt" TIMESTAMP(3),
    "lapseWarnedAt" TIMESTAMP(3),
    "lapsedAt" TIMESTAMP(3),
    "pledgeAcceptedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaptainStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaptainPromotion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "podId" TEXT NOT NULL,
    "toLevel" INTEGER NOT NULL,
    "status" "PromotionStatus" NOT NULL DEFAULT 'PENDING',
    "evidence" JSONB NOT NULL,
    "flags" JSONB NOT NULL,
    "autoApproved" BOOLEAN NOT NULL DEFAULT false,
    "decidedBy" TEXT,
    "decisionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "CaptainPromotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaptainAuditLog" (
    "id" TEXT NOT NULL,
    "actorEmail" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fromLevel" INTEGER,
    "toLevel" INTEGER,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaptainAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Drill_podId_startedAt_idx" ON "Drill"("podId", "startedAt");

-- CreateIndex
CREATE INDEX "DrillResponse_userId_idx" ON "DrillResponse"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DrillResponse_drillId_userId_key" ON "DrillResponse"("drillId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "CaptainStatus_userId_key" ON "CaptainStatus"("userId");

-- CreateIndex
CREATE INDEX "CaptainPromotion_status_createdAt_idx" ON "CaptainPromotion"("status", "createdAt");

-- CreateIndex
CREATE INDEX "CaptainPromotion_userId_idx" ON "CaptainPromotion"("userId");

-- CreateIndex
CREATE INDEX "CaptainAuditLog_userId_createdAt_idx" ON "CaptainAuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Pod_parentPodId_idx" ON "Pod"("parentPodId");

-- AddForeignKey
ALTER TABLE "Pod" ADD CONSTRAINT "Pod_parentPodId_fkey" FOREIGN KEY ("parentPodId") REFERENCES "Pod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Drill" ADD CONSTRAINT "Drill_podId_fkey" FOREIGN KEY ("podId") REFERENCES "Pod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrillResponse" ADD CONSTRAINT "DrillResponse_drillId_fkey" FOREIGN KEY ("drillId") REFERENCES "Drill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrillResponse" ADD CONSTRAINT "DrillResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaptainStatus" ADD CONSTRAINT "CaptainStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaptainPromotion" ADD CONSTRAINT "CaptainPromotion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

