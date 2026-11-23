-- AlterEnum
ALTER TYPE "RequestStatus" ADD VALUE 'EXPIRED';

-- CreateEnum
CREATE TYPE "AlertScope" AS ENUM ('POD', 'NEARBY');

-- CreateEnum
CREATE TYPE "AlertAnswer" AS ENUM ('COMING', 'CANT');

-- AlterTable
ALTER TABLE "BloodRequest" ADD COLUMN     "isTest" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "widenAt" TIMESTAMP(3),
ADD COLUMN     "widenedAt" TIMESTAMP(3),
ADD COLUMN     "closedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "BloodRequestRecipient" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scope" "AlertScope" NOT NULL,
    "notifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pushed" BOOLEAN NOT NULL DEFAULT false,
    "emailed" BOOLEAN NOT NULL DEFAULT false,
    "answer" "AlertAnswer",
    "answeredAt" TIMESTAMP(3),

    CONSTRAINT "BloodRequestRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BloodRequestRecipient_requestId_userId_key" ON "BloodRequestRecipient"("requestId", "userId");

-- CreateIndex
CREATE INDEX "BloodRequestRecipient_userId_notifiedAt_idx" ON "BloodRequestRecipient"("userId", "notifiedAt");

-- CreateIndex
CREATE INDEX "BloodRequest_status_expiresAt_idx" ON "BloodRequest"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "BloodRequest_requesterId_createdAt_idx" ON "BloodRequest"("requesterId", "createdAt");

-- AddForeignKey
ALTER TABLE "BloodRequestRecipient" ADD CONSTRAINT "BloodRequestRecipient_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "BloodRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodRequestRecipient" ADD CONSTRAINT "BloodRequestRecipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
