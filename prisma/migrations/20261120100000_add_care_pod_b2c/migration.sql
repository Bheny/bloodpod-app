-- CreateEnum
CREATE TYPE "ConditionType" AS ENUM ('SICKLE_CELL', 'THALASSEMIA', 'DIALYSIS', 'CANCER', 'OTHER');

-- CreateEnum
CREATE TYPE "ConditionVisibility" AS ENUM ('PRIVATE', 'SHARED');

-- CreateEnum
CREATE TYPE "CareKind" AS ENUM ('CARE', 'CASE');

-- CreateEnum
CREATE TYPE "RotaStatus" AS ENUM ('REQUESTED', 'YES', 'NO', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'CARE', 'CASE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentKind" AS ENUM ('CARE_SUBSCRIPTION', 'CASE_ONE_OFF');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "SponsorshipStatus" AS ENUM ('ACTIVE', 'ENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('REQUESTED', 'CONFIRMED', 'CANCELLED');

-- CreateTable
CREATE TABLE "CareProfile" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "podId" TEXT,
    "kind" "CareKind" NOT NULL DEFAULT 'CARE',
    "displayName" TEXT NOT NULL,
    "conditionType" "ConditionType" NOT NULL,
    "conditionVisibility" "ConditionVisibility" NOT NULL DEFAULT 'PRIVATE',
    "bloodType" "BloodType" NOT NULL,
    "organisationId" TEXT,
    "hospitalName" TEXT,
    "transfusionIntervalDays" INTEGER,
    "nextTransfusionAt" TIMESTAMP(3),
    "donorsNeeded" INTEGER NOT NULL DEFAULT 2,
    "caseTargetDate" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "consentAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransfusionDate" (
    "id" TEXT NOT NULL,
    "careProfileId" TEXT NOT NULL,
    "organisationId" TEXT,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "donorsNeeded" INTEGER NOT NULL DEFAULT 2,
    "completedAt" TIMESTAMP(3),
    "familyReminderSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransfusionDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RotaEntry" (
    "id" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "transfusionDateId" TEXT NOT NULL,
    "status" "RotaStatus" NOT NULL DEFAULT 'REQUESTED',
    "respondedAt" TIMESTAMP(3),
    "remind3dSentAt" TIMESTAMP(3),
    "remind1dSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RotaEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "careProfileId" TEXT,
    "plan" "SubscriptionPlan" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "paystackSubscriptionCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "careProfileId" TEXT,
    "amountPesewas" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "kind" "PaymentKind" NOT NULL,
    "paystackReference" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sponsorship" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "careProfileId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "SponsorshipStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sponsorship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "critical" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Perk" (
    "id" TEXT NOT NULL,
    "partnerOrgId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "validUntil" TIMESTAMP(3),
    "eligibility" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Perk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lab" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT,
    "name" TEXT NOT NULL,
    "town" TEXT NOT NULL,
    "tests" JSONB NOT NULL,
    "commissionRate" DECIMAL(5,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "testName" TEXT NOT NULL,
    "genotype" "Genotype",
    "bloodType" "BloodType",
    "status" "BookingStatus" NOT NULL DEFAULT 'REQUESTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CareProfile_ownerId_idx" ON "CareProfile"("ownerId");

-- CreateIndex
CREATE INDEX "CareProfile_organisationId_idx" ON "CareProfile"("organisationId");

-- CreateIndex
CREATE INDEX "TransfusionDate_careProfileId_scheduledFor_idx" ON "TransfusionDate"("careProfileId", "scheduledFor");

-- CreateIndex
CREATE INDEX "RotaEntry_donorId_idx" ON "RotaEntry"("donorId");

-- CreateIndex
CREATE UNIQUE INDEX "RotaEntry_transfusionDateId_donorId_key" ON "RotaEntry"("transfusionDateId", "donorId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_paystackSubscriptionCode_key" ON "Subscription"("paystackSubscriptionCode");

-- CreateIndex
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX "Subscription_careProfileId_idx" ON "Subscription"("careProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_paystackReference_key" ON "Payment"("paystackReference");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");

-- CreateIndex
CREATE INDEX "Sponsorship_organisationId_status_idx" ON "Sponsorship"("organisationId", "status");

-- CreateIndex
CREATE INDEX "Sponsorship_careProfileId_idx" ON "Sponsorship"("careProfileId");

-- CreateIndex
CREATE INDEX "NotificationLog_userId_createdAt_idx" ON "NotificationLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");

-- AddForeignKey
ALTER TABLE "CareProfile" ADD CONSTRAINT "CareProfile_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareProfile" ADD CONSTRAINT "CareProfile_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Hospital"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransfusionDate" ADD CONSTRAINT "TransfusionDate_careProfileId_fkey" FOREIGN KEY ("careProfileId") REFERENCES "CareProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RotaEntry" ADD CONSTRAINT "RotaEntry_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RotaEntry" ADD CONSTRAINT "RotaEntry_transfusionDateId_fkey" FOREIGN KEY ("transfusionDateId") REFERENCES "TransfusionDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_careProfileId_fkey" FOREIGN KEY ("careProfileId") REFERENCES "CareProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sponsorship" ADD CONSTRAINT "Sponsorship_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sponsorship" ADD CONSTRAINT "Sponsorship_careProfileId_fkey" FOREIGN KEY ("careProfileId") REFERENCES "CareProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

