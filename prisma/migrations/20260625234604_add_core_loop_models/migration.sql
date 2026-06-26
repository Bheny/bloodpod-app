-- CreateEnum
CREATE TYPE "RequestUrgency" AS ENUM ('STANDARD', 'URGENT', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('OPEN', 'MATCHED', 'FULFILLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('BLOOD_REQUEST', 'MEMBER_JOINED', 'DONATION_LOGGED', 'INVITE_ACCEPTED', 'HOSPITAL_VERIFIED', 'BADGE_EARNED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "donationStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastStreakDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "BloodRequest" (
    "id" TEXT NOT NULL,
    "podId" TEXT,
    "requesterId" TEXT NOT NULL,
    "bloodType" "BloodType" NOT NULL,
    "urgency" "RequestUrgency" NOT NULL DEFAULT 'URGENT',
    "facility" TEXT NOT NULL,
    "location" TEXT,
    "message" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'OPEN',
    "respondedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BloodRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BloodRequest" ADD CONSTRAINT "BloodRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
