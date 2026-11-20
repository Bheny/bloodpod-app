/**
 * Every number the Captain programme runs on. Change a rule here and nowhere else.
 * Nothing here is tied to payment of any kind: it is recognition, tools and access only.
 */
export const CAPTAIN = {
  /** AppSetting key. The whole programme is off unless this is "true". */
  flagKey: "captain_programme",

  /** A child Pod counts only with this many unique, phone-verified, eligible members, its leader included. */
  childMinMembers: 3,
  /** ...and a drill or alert response inside this window. */
  activityWindowDays: 60,

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

  /** Time to put things right after the requirements stop being met. */
  lapseGraceDays: 60,
  lapseWarnAfterDays: 30,

  /** A child Pod that looks suspicious is reviewed by a person, never blocked automatically. */
  integrity: {
    childCreatedWithinMinutes: 10,
    burstJoinCount: 5,
    burstWithinMinutes: 2,
  },
} as const;

export const PLEDGE = "I will never ask for, offer or accept payment for donating blood.";

/** Children each level needs. Level 0 needs 1; level 1 needs 3 qualifying; level k >= 2 needs 3 led by level k-2 or higher. */
export const CHILDREN_REQUIRED = [1, 3, 3, 3, 3, 3] as const;
export const MAX_LEVEL = 5;

export const LEVEL_TITLES = [
  "Captain",
  "Senior Captain",
  "Lead Captain",
  "Area Lead",
  "District Lead",
  "Regional Lead",
] as const;
export const STARTER_TITLE = "Pod Starter";

/** Pods in the whole tree (not just direct children) at each level, used as test fixtures. */
export const DESCENDANT_PODS_BY_LEVEL = [1, 3, 6, 12, 21, 39] as const;

export const titleFor = (level: number | null) => (level === null ? STARTER_TITLE : LEVEL_TITLES[level]);
