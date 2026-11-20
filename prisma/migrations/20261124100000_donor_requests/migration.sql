-- CreateEnum
CREATE TYPE "DonorRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED');

-- CreateTable
CREATE TABLE "DonorRequest" (
    "id" TEXT NOT NULL,
    "seekerId" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "message" TEXT,
    "status" "DonorRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "DonorRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DonorRequest_donorId_status_idx" ON "DonorRequest"("donorId", "status");

-- CreateIndex
CREATE INDEX "DonorRequest_seekerId_createdAt_idx" ON "DonorRequest"("seekerId", "createdAt");

-- AddForeignKey
ALTER TABLE "DonorRequest" ADD CONSTRAINT "DonorRequest_seekerId_fkey" FOREIGN KEY ("seekerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonorRequest" ADD CONSTRAINT "DonorRequest_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

