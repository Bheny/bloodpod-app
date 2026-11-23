-- AlterTable
ALTER TABLE "User" ADD COLUMN     "getStartedDismissedAt" TIMESTAMP(3),
ADD COLUMN     "getStartedSeen" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "tourSeenAt" TIMESTAMP(3);

-- People who already finished setting up do not get the first-run tour. Their checklist still shows.
UPDATE "User" SET "tourSeenAt" = NOW() WHERE "onboardingComplete" = true;
