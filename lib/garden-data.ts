import { prisma } from "@/lib/prisma";
import { READINESS } from "@/lib/readiness-config";
import { podPeople } from "@/lib/readiness/people";
import { splitPeople, type DuplicateReason } from "@/lib/readiness/members";
import {
  DRILL_FRESH_DAYS,
  gardenStage,
  gardenerTitle,
  plotHealth,
  plotNudge,
  weekStart,
  type GardenStage,
  type PlotLabel,
  type TendKind,
  type TitleProgress,
} from "@/lib/garden";

/**
 * Reads a person's Garden: the Pods they lead as plots, the stage of the whole Garden, and their gardener title.
 * Reading only, and only for the person themselves. Nothing here is used by alerts, listing, search or joining.
 */

const DAY = 86_400_000;

export interface PlotView {
  podId: string;
  name: string;
  /** Everyone in the Pod, the leader included. */
  total: number;
  ready: number;
  needed: number;
  /** People who are the same person as someone already counted, and why. They are never counted twice. */
  duplicates: { name: string; sameAs: string; reason: DuplicateReason }[];
  /** Not verified yet, or not eligible to give right now. */
  notReady: number;
  score: number;
  label: PlotLabel;
  nudge: string | null;
  lastDrill: { startedAt: Date; passed: boolean | null; closed: boolean } | null;
}

export interface GardenView {
  plots: PlotView[];
  /** Everyone ready across every plot, once each. */
  uniqueReady: number;
  stage: GardenStage;
  drillPassedRecently: boolean;
  title: TitleProgress;
  tendedThisWeek: boolean;
  weeks: number;
  groveWeeks: number;
  /** Has asked to be left off the Garden leaders posters. */
  hidden: boolean;
}

const first = (n: string | null) => n?.trim().split(/\s+/)[0] || "Someone";

/** The stage and the people behind it, without the page's extra detail. */
async function gardenCore(userId: string) {
  const owned = await prisma.pod.findMany({ where: { ownerId: userId }, orderBy: { createdAt: "asc" }, select: { id: true } });
  const found = await Promise.all(owned.map((p) => podPeople(p.id)));
  const pods = found.filter((f): f is NonNullable<typeof f> => f !== null);

  const since = new Date(Date.now() - DRILL_FRESH_DAYS * DAY);
  const passedDrills = await Promise.all(
    pods.map((f) => prisma.drill.findFirst({ where: { podId: f.pod.id, passed: true, closedAt: { not: null } }, orderBy: { closedAt: "desc" }, select: { closedAt: true } })),
  );
  const drillPassedRecently = passedDrills.some((d) => d?.closedAt && d.closedAt >= since);
  const uniqueReady = splitPeople(pods.flatMap((f) => f.people)).counted.length;
  return { pods, passedDrills, drillPassedRecently, uniqueReady, stage: gardenStage(uniqueReady, drillPassedRecently) };
}

export interface GardenSummary {
  stageName: string;
  uniqueReady: number;
  plots: number;
  titleName: string | null;
  tendedThisWeek: boolean;
}

/** The short version for the dashboard: no per-plot detail. */
export async function getGardenSummary(userId: string): Promise<GardenSummary> {
  try {
    const [core, weeks, thisWeek] = await Promise.all([
      gardenCore(userId),
      prisma.tendedWeek.findMany({ where: { userId }, select: { stage: true } }),
      prisma.tendedWeek.findUnique({ where: { userId_weekStart: { userId, weekStart: weekStart(new Date()) } }, select: { id: true } }),
    ]);
    const title = gardenerTitle({
      ownsPod: core.pods.length > 0,
      weeks: weeks.length,
      groveWeeks: weeks.filter((w) => w.stage >= 3).length,
    }).title;
    return { stageName: core.stage.name, uniqueReady: core.uniqueReady, plots: core.pods.length, titleName: title?.name ?? null, tendedThisWeek: !!thisWeek };
  } catch {
    // The home screen must never fail because of the Garden (for example, before its table exists).
    return { stageName: "Bare ground", uniqueReady: 0, plots: 0, titleName: null, tendedThisWeek: false };
  }
}

export async function getGarden(userId: string): Promise<GardenView> {
  const now = new Date();
  const [core, ledger, thisWeek, me] = await Promise.all([
    gardenCore(userId),
    prisma.tendedWeek.findMany({ where: { userId }, select: { stage: true } }),
    prisma.tendedWeek.findUnique({ where: { userId_weekStart: { userId, weekStart: weekStart(now) } }, select: { id: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { gardenHidden: true } }),
  ]);

  const plots: PlotView[] = await Promise.all(
    core.pods.map(async (f, i) => {
      const split = splitPeople(f.people);
      const lastDrill = await prisma.drill.findFirst({
        where: { podId: f.pod.id },
        orderBy: { startedAt: "desc" },
        select: { startedAt: true, passed: true, closedAt: true },
      });
      const input = {
        ready: split.counted.length,
        needed: READINESS.drillMinEligible,
        lastPassedDrillAt: core.passedDrills[i]?.closedAt ?? null,
        lastActivityAt: f.pod.lastActivityAt,
      };
      return {
        podId: f.pod.id,
        name: f.pod.name,
        total: f.people.length,
        ready: split.counted.length,
        needed: READINESS.drillMinEligible,
        duplicates: split.duplicates.map((d) => ({ name: first(d.person.name), sameAs: first(d.sameAs.name), reason: d.reason })),
        notReady: split.notReady.length,
        ...plotHealth(input, now),
        nudge: plotNudge(input, now),
        lastDrill: lastDrill ? { startedAt: lastDrill.startedAt, passed: lastDrill.passed, closed: !!lastDrill.closedAt } : null,
      };
    }),
  );

  const weeks = ledger.length;
  const groveWeeks = ledger.filter((w) => w.stage >= 3).length;
  return {
    plots,
    uniqueReady: core.uniqueReady,
    stage: core.stage,
    drillPassedRecently: core.drillPassedRecently,
    title: gardenerTitle({ ownsPod: core.pods.length > 0, weeks, groveWeeks }),
    tendedThisWeek: !!thisWeek,
    weeks,
    groveWeeks,
    hidden: me?.gardenHidden ?? false,
  };
}

/**
 * Counts this week as tended. One row per person per week, however many things they did, so it cannot be farmed.
 * It never fails the thing that called it: a drill must go out even if this cannot be saved.
 */
export async function recordTended(userId: string, kind: TendKind): Promise<void> {
  try {
    const ws = weekStart(new Date());
    const { stage } = await gardenCore(userId);
    const existing = await prisma.tendedWeek.findUnique({ where: { userId_weekStart: { userId, weekStart: ws } }, select: { id: true, stage: true } });
    if (!existing) {
      await prisma.tendedWeek.create({ data: { userId, weekStart: ws, stage: stage.stage, kind } }).catch(() => undefined);
    } else if (stage.stage > existing.stage) {
      await prisma.tendedWeek.update({ where: { id: existing.id }, data: { stage: stage.stage } });
    }
  } catch {
    // A garden note must never stop a drill.
  }
}
