/**
 * The Garden: one per donor. Pure rules, no database, so every edge can be tested.
 *
 * - The whole Garden has a stage (Seed, Sprout, Grove, Forest), from the people who are ready across all the
 *   Pods you lead. Someone in three of your Pods counts once.
 * - Each Pod is a plot with a health score from 0 to 100.
 * - The person has a gardener title, built from tended weeks. A title never goes down.
 *
 * Nothing here touches alerts, listing, search or joining. A test keeps it that way.
 */

const DAY = 86_400_000;

// ── The Garden's stage ───────────────────────────────────────────────────────

export const STAGES = [
  { id: 0, name: "Bare ground", minReady: 0 },
  { id: 1, name: "Seed", minReady: 1 },
  { id: 2, name: "Sprout", minReady: 3 },
  { id: 3, name: "Grove", minReady: 8 },
  { id: 4, name: "Forest", minReady: 30 },
] as const;

export type StageId = (typeof STAGES)[number]["id"];

/** Grove and Forest need a drill to have passed lately, so a big but untested Garden does not read as strong. */
export const DRILL_FRESH_DAYS = 90;
const GROVE: StageId = 3;

export interface GardenStage {
  stage: StageId;
  name: string;
  /** What is holding it back, in plain words. Null when nothing is. */
  next: { name: string; line: string } | null;
}

export function gardenStage(ready: number, drillPassedRecently: boolean): GardenStage {
  let stage: StageId = 0;
  for (const s of STAGES) if (ready >= s.minReady) stage = s.id;

  const held = stage >= GROVE && !drillPassedRecently;
  const shown: StageId = held ? 2 : stage;
  const name = STAGES[shown].name;

  if (held) {
    return { stage: shown, name, next: { name: STAGES[GROVE].name, line: `Pass a drill to reach ${STAGES[GROVE].name}. You have the people for it.` } };
  }
  const upcoming = STAGES[shown + 1];
  if (!upcoming) return { stage: shown, name, next: null };

  const more = upcoming.minReady - ready;
  const people = `${more} more ready ${more === 1 ? "person" : "people"}`;
  const needsDrill = upcoming.id >= GROVE && !drillPassedRecently;
  return {
    stage: shown,
    name,
    next: { name: upcoming.name, line: needsDrill ? `${people} and a passed drill to reach ${upcoming.name}` : `${people} to reach ${upcoming.name}` },
  };
}

// ── A plot's health ──────────────────────────────────────────────────────────

export const PLOT = {
  /** Points from how many of the Pod are ready, measured against what a drill needs. */
  readyPoints: 50,
  drillPoints: 30,
  freshPoints: 20,
  /** Full marks inside this many days, fading to nothing at `fadeDays`. */
  fullDays: 30,
  fadeDays: 90,
  thriving: 75,
  needsWater: 40,
} as const;

export interface PlotInput {
  ready: number;
  /** A drill needs at least this many. */
  needed: number;
  /** The last drill that finished, if it passed. A failed or missing drill scores nothing. */
  lastPassedDrillAt: Date | null;
  lastActivityAt: Date | null;
}

function fade(at: Date | null, now: Date): number {
  if (!at) return 0;
  const age = (now.getTime() - at.getTime()) / DAY;
  if (age <= PLOT.fullDays) return 1;
  if (age >= PLOT.fadeDays) return 0;
  return 1 - (age - PLOT.fullDays) / (PLOT.fadeDays - PLOT.fullDays);
}

export type PlotLabel = "Thriving" | "Needs water" | "Wilting";

export function plotHealth(input: PlotInput, now = new Date()): { score: number; label: PlotLabel } {
  const share = input.needed > 0 ? Math.min(1, input.ready / input.needed) : 0;
  const raw = share * PLOT.readyPoints + fade(input.lastPassedDrillAt, now) * PLOT.drillPoints + fade(input.lastActivityAt, now) * PLOT.freshPoints;
  const score = input.ready === 0 ? 0 : Math.round(raw);
  const label: PlotLabel = score >= PLOT.thriving ? "Thriving" : score >= PLOT.needsWater ? "Needs water" : "Wilting";
  return { score, label };
}

/** One plain sentence on what would help a plot most. Null when it is thriving. */
export function plotNudge(input: PlotInput, now = new Date()): string | null {
  if (input.ready < input.needed) {
    const more = input.needed - input.ready;
    return `${more} more ready ${more === 1 ? "person" : "people"} and a drill can show this Pod would answer`;
  }
  if (fade(input.lastPassedDrillAt, now) < 1) return input.lastPassedDrillAt ? "No passed drill in the last month. Run one to keep this Pod fresh" : "Run a drill to show this Pod would answer";
  if (fade(input.lastActivityAt, now) < 1) return "Quiet lately. A drill wakes everyone up";
  return null;
}

// ── The gardener's title ─────────────────────────────────────────────────────

export const TITLES = [
  { id: 1, name: "Planter", weeks: 0, groveWeeks: 0, means: "Started a Pod" },
  { id: 2, name: "Tender", weeks: 4, groveWeeks: 0, means: "Kept it up for a month" },
  { id: 3, name: "Gardener", weeks: 12, groveWeeks: 1, means: "Three months, and a Grove" },
  { id: 4, name: "Cultivator", weeks: 26, groveWeeks: 13, means: "Half a year, mostly at Grove or above" },
  { id: 5, name: "Steward", weeks: 52, groveWeeks: 39, means: "A year of looking after it" },
  { id: 6, name: "Keeper", weeks: 104, groveWeeks: 78, means: "Two years, and it has held" },
] as const;

export interface TitleInput {
  ownsPod: boolean;
  /** Tended weeks, one per calendar week however much was done. */
  weeks: number;
  /** Tended weeks in which the Garden was at Grove or above. */
  groveWeeks: number;
}

export interface TitleProgress {
  title: (typeof TITLES)[number] | null;
  next: { name: string; line: string } | null;
}

/** Only ever goes up: both counts only grow. */
export function gardenerTitle(input: TitleInput): TitleProgress {
  if (!input.ownsPod && input.weeks === 0) return { title: null, next: { name: TITLES[0].name, line: "Start a Pod to become a Planter" } };

  let reached: (typeof TITLES)[number] = TITLES[0];
  for (const t of TITLES) if (input.weeks >= t.weeks && input.groveWeeks >= t.groveWeeks) reached = t;
  const upcoming = TITLES.find((t) => t.id === reached.id + 1);
  if (!upcoming) return { title: reached, next: null };

  const parts: string[] = [];
  const weeksLeft = upcoming.weeks - input.weeks;
  const groveLeft = upcoming.groveWeeks - input.groveWeeks;
  if (weeksLeft > 0) parts.push(`${weeksLeft} more tended ${weeksLeft === 1 ? "week" : "weeks"}`);
  if (groveLeft > 0) parts.push(`${groveLeft} more ${groveLeft === 1 ? "week" : "weeks"} with your Garden at Grove`);
  return { title: reached, next: { name: upcoming.name, line: `${parts.join(" and ")} to become a ${upcoming.name}` } };
}

// ── Weeks ────────────────────────────────────────────────────────────────────

/** The Monday of this date's week, at midnight UTC. A week is counted once, whatever was done in it. */
export function weekStart(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const sinceMonday = (d.getUTCDay() + 6) % 7;
  return new Date(d.getTime() - sinceMonday * DAY);
}

/** Why a week counts. Each is real upkeep that makes a Pod safer. Donating and inviting are never on this list. */
export type TendKind = "DRILL_STARTED" | "DRILL_ANSWERED" | "CHECK_IN";
