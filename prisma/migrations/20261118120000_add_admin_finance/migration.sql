-- CreateEnum
CREATE TYPE "LedgerType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "LedgerStatus" AS ENUM ('PAID', 'PENDING');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ENDED');

-- AlterTable
ALTER TABLE "Hospital" ADD COLUMN     "reviewNote" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedBy" TEXT;

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "type" "LedgerType" NOT NULL,
    "status" "LedgerStatus" NOT NULL DEFAULT 'PAID',
    "category" TEXT NOT NULL,
    "description" TEXT,
    "amountPesewas" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "invoiceNo" TEXT,
    "hospitalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "monthlyPesewas" INTEGER NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "status" "ContractStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "LedgerEntry_date_idx" ON "LedgerEntry"("date");

-- CreateIndex
CREATE INDEX "LedgerEntry_type_status_idx" ON "LedgerEntry"("type", "status");

-- CreateIndex
CREATE INDEX "Contract_status_idx" ON "Contract"("status");

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;
