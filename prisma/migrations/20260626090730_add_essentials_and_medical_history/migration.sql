-- CreateEnum
CREATE TYPE "Genotype" AS ENUM ('AA', 'AS', 'SS', 'AC', 'SC', 'CC', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "IdCardType" AS ENUM ('NATIONAL_ID', 'NHIS', 'VOTER_ID', 'DRIVERS_LICENSE', 'PASSPORT', 'STUDENT_ID', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('MEDICAL_RECORD', 'INSURANCE', 'VACCINATION', 'PRESCRIPTION', 'LAB_RESULT', 'OTHER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "allergies" TEXT,
ADD COLUMN     "chronicConditions" TEXT,
ADD COLUMN     "emergencyContactName" TEXT,
ADD COLUMN     "emergencyContactPhone" TEXT,
ADD COLUMN     "genotype" "Genotype",
ADD COLUMN     "medications" TEXT;

-- CreateTable
CREATE TABLE "IdCard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "IdCardType" NOT NULL,
    "label" TEXT,
    "cardNumber" TEXT,
    "issuingAuthority" TEXT,
    "expiryDate" TIMESTAMP(3),
    "frontImagePath" TEXT,
    "backImagePath" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "title" TEXT NOT NULL,
    "filePath" TEXT,
    "notes" TEXT,
    "documentDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "IdCard" ADD CONSTRAINT "IdCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
