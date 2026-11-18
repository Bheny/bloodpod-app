-- CreateEnum
CREATE TYPE "HospitalKind" AS ENUM ('HOSPITAL', 'CLINIC', 'BLOOD_BANK');

-- CreateEnum
CREATE TYPE "HospitalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emergencyConsentAt" TIMESTAMP(3),
ADD COLUMN     "hospitalId" TEXT,
ADD COLUMN     "jobTitle" TEXT,
ADD COLUMN     "phoneVerifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Hospital" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "HospitalKind" NOT NULL DEFAULT 'HOSPITAL',
    "city" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "note" TEXT,
    "status" "HospitalStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hospital_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Hospital_status_idx" ON "Hospital"("status");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE SET NULL ON UPDATE CASCADE;
