-- Records who wants a paid plan before payments are switched on.
CREATE TABLE "PlanInterest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanInterest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlanInterest_userId_plan_key" ON "PlanInterest"("userId", "plan");
CREATE INDEX "PlanInterest_plan_idx" ON "PlanInterest"("plan");

ALTER TABLE "PlanInterest" ADD CONSTRAINT "PlanInterest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
