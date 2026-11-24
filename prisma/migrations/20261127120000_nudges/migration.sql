-- AlterTable
ALTER TABLE "User" ADD COLUMN "nudgesOff" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Nudge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "key" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pushedAt" TIMESTAMP(3),
    "emailedAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "actedAt" TIMESTAMP(3),

    CONSTRAINT "Nudge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Nudge_userId_kind_createdAt_idx" ON "Nudge"("userId", "kind", "createdAt");

-- CreateIndex
CREATE INDEX "Nudge_kind_createdAt_idx" ON "Nudge"("kind", "createdAt");

-- AddForeignKey
ALTER TABLE "Nudge" ADD CONSTRAINT "Nudge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
