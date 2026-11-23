-- The Garden's gardener title: one row per person per week of real upkeep. A ledger, so it outlives any Pod.
CREATE TABLE "TendedWeek" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStart" DATE NOT NULL,
    "stage" INTEGER NOT NULL DEFAULT 0,
    "kind" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TendedWeek_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TendedWeek_userId_weekStart_key" ON "TendedWeek"("userId", "weekStart");

ALTER TABLE "TendedWeek" ADD CONSTRAINT "TendedWeek_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
