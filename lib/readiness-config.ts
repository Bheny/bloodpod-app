/**
 * Every number Pod readiness runs on. Change a rule here and nowhere else.
 * Every donor can lead a Pod, so nothing here sorts people into levels, and nothing is tied to payment of any kind.
 */
export const READINESS = {
  /** A drill counts only when the Pod has at least this many eligible members. */
  drillMinEligible: 5,
  /**
   * A complete Pod: this many ready people who know they may be called. A drill only needs
   * drillMinEligible, but the goal is for every donor to have this many on hand.
   */
  podComplete: 10,
  /** Share of eligible members who must answer inside the window. */
  drillPassRate: 0.6,
  drillWindowMinutes: 10,
  /** One drill per Pod per this many days. */
  drillCooldownDays: 7,

  /**
   * Who counts as ready: a finished profile and eligible to give. Turn this on once the app can verify phones
   * with a texted code (nothing sets a verified phone yet, so with it on, nobody would count). People are
   * still counted once by phone number either way.
   */
  requireVerifiedPhone: false,

  /** A member can start their own Pod once this many people they invited have joined and finished their profile. */
  spinoffMinInvitees: 5,
  /** Across everyone, new spin-off Pods per person per week. */
  spinoffsPerWeek: 3,
} as const;

/** The promise every donor makes by being here. It is also written into the Terms. */
export const PLEDGE = "I will never ask for, offer or accept payment for donating blood.";
