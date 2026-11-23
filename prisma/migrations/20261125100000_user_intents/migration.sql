-- AlterTable
ALTER TABLE "User" ADD COLUMN     "intents" TEXT[] DEFAULT ARRAY[]::TEXT[];
