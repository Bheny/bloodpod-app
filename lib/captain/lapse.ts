import { CAPTAIN } from "@/lib/captain-config";

const DAY = 86_400_000;

export type LapseStage = "ok" | "grace" | "warn" | "lapsed";

/**
 * When the requirements stop being met the badge is not pulled at once: the leader gets a grace
 * period to put things right. Day 30 of it is a warning, day 60 is the lapse.
 */
export function lapseStage(lapseStartedAt: Date | null, now: Date = new Date()): { stage: LapseStage; daysIn: number; daysLeft: number } {
  if (!lapseStartedAt) return { stage: "ok", daysIn: 0, daysLeft: CAPTAIN.lapseGraceDays };
  const daysIn = Math.floor((now.getTime() - lapseStartedAt.getTime()) / DAY);
  const daysLeft = Math.max(CAPTAIN.lapseGraceDays - daysIn, 0);
  if (daysIn >= CAPTAIN.lapseGraceDays) return { stage: "lapsed", daysIn, daysLeft: 0 };
  if (daysIn >= CAPTAIN.lapseWarnAfterDays) return { stage: "warn", daysIn, daysLeft };
  return { stage: "grace", daysIn, daysLeft };
}
