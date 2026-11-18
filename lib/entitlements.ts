import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

/**
 * Paid plans buy planning tools only. They never change who is alerted, in what
 * order, or whether anyone can list, join a Pod or send an alert. Those are not
 * features here, on purpose.
 */
export type Feature =
  | "care_dashboard"
  | "donor_rota"
  | "family_blood_card"
  | "medical_id"
  | "donor_reminders";

export const PLAN_FEATURES: Record<SubscriptionPlan, readonly Feature[]> = {
  FREE: [],
  CARE: ["care_dashboard", "donor_rota", "family_blood_card", "medical_id", "donor_reminders"],
  CASE: ["care_dashboard", "donor_rota", "family_blood_card", "medical_id", "donor_reminders"],
};

export interface SubscriptionLike {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodEnd: Date;
}

export interface EntitlementSubject {
  /** Read from the database, never from the client. */
  subscriptions: readonly SubscriptionLike[];
  /** True when an active hospital sponsorship covers the profile being viewed. */
  sponsored?: boolean;
}

/**
 * A plan is live while ACTIVE, or while the paid period has not ended. Failed or
 * cancelled plans downgrade at currentPeriodEnd, not immediately.
 */
function isLive(s: SubscriptionLike, now: Date): boolean {
  if (s.status === "EXPIRED") return false;
  return s.currentPeriodEnd.getTime() > now.getTime();
}

export function effectivePlans(user: EntitlementSubject, now = new Date()): SubscriptionPlan[] {
  const plans = new Set<SubscriptionPlan>(["FREE"]);
  for (const s of user.subscriptions) if (isLive(s, now)) plans.add(s.plan);
  if (user.sponsored) plans.add("CARE");
  return [...plans];
}

export function can(user: EntitlementSubject, feature: Feature, now = new Date()): boolean {
  return effectivePlans(user, now).some((p) => PLAN_FEATURES[p].includes(feature));
}
