/*
  Warnings:

  - Added the required column `bloodType` to the `Donation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Donation" ADD COLUMN     "bloodType" "BloodType" NOT NULL,
ADD COLUMN     "notes" TEXT;
