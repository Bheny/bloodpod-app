/**
 * Every number Pod readiness runs on. Change a rule here and nowhere else.
 * Every donor can lead a Pod, so nothing here sorts people into levels, and nothing is tied to payment of any kind.
 */
export const READINESS = {
  /** A drill counts only when the Pod has at least this many eligible members. */
  drillMinEligible: 5,
  /** Share of eligible members who must answer inside the window. */
  drillPassRate: 0.6,
  drillWindowMinutes: 10,
  /** One drill per Pod per this many days. */
  drillCooldownDays: 7,

  /** A member can start their own Pod once this many people they invited have joined and finished their profile. */
  spinoffMinInvitees: 5,
  /** Across everyone, new spin-off Pods per person per week. */
  spinoffsPerWeek: 3,
} as const;

/** The promise every donor makes by being here. It is also written into the Terms. */
export const PLEDGE = "I will never ask for, offer or accept payment for donating blood.";
