import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

/**
 * Paid plans buy planning tools only. They never change who is alerted, in what
 * order, or whether anyone can list, join a Pod or send an alert. Those are not
 * features here, on purpose.
 *
 * Basic is about you, Plus is about your household. Care and Case are separate
 * add-ons for recurring or planned transfusions: neither includes the other's tools,
 * and neither needs Basic or Plus.
 */
export type Feature =
  // Care Pod and Case Pod
  | "care_dashboard"
  | "donor_rota"
  | "family_blood_card"
  | "medical_id"
  | "donor_reminders"
  // Basic
  | "request_tracker"
  | "saved_searches"
  | "pod_reminders"
  | "donation_export"
  // Plus
  | "dependant_cards"
  | "family_contacts_notify"
  | "second_manager";

const CARE_TOOLS: readonly Feature[] = ["care_dashboard", "donor_rota", "family_blood_card", "medical_id", "donor_reminders"];

const BASIC_TOOLS: readonly Feature[] = ["medical_id", "request_tracker", "saved_searches", "pod_reminders", "donation_export"];

/** Plus is everything in Basic, for a family. */
const PLUS_TOOLS: readonly Feature[] = [...BASIC_TOOLS, "dependant_cards", "family_contacts_notify", "second_manager"];

export const PLAN_FEATURES: Record<SubscriptionPlan, readonly Feature[]> = {
  FREE: [],
  BASIC: BASIC_TOOLS,
  PLUS: PLUS_TOOLS,
  CARE: CARE_TOOLS,
  CASE: CARE_TOOLS,
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
