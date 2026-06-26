-- CreateEnum
CREATE TYPE "InviteKind" AS ENUM ('DIRECT', 'SHARE');

-- AlterEnum
ALTER TYPE "InviteStatus" ADD VALUE 'REVOKED';

-- AlterTable
ALTER TABLE "PodInvite" ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "kind" "InviteKind" NOT NULL DEFAULT 'DIRECT';

-- CreateIndex
CREATE UNIQUE INDEX "PodInvite_code_key" ON "PodInvite"("code");
