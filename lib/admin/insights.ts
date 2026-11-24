import type { BloodType } from "@prisma/client";
import { adb as prisma } from "@/lib/admin/db";
import { BLOOD_TYPE_LABELS } from "@/lib/blood-type";
import { pct } from "@/lib/admin/format";
import { effectiveStatus, secondsToFirstYes, URGENCY_LABEL } from "@/lib/alert-rules";

/**
 * Insights: supply and response, as numbers a hospital, sponsor or partner could be shown.
 *
 * Everything here is a count or a median. No names, phones, emails or single rows leave this file, and
 * any group smaller than MIN_GROUP is hidden, so a small city cannot point at one donor. Test alerts
 * and hospital or lab staff are left out throughout.
 */

const DAY = 86_400_000;
/** A cell with fewer people than this (but more than none) is shown as "<5", not as a number. */
export const MIN_GROUP = 5;

export const INSIGHT_WINDOWS = [30, 90, 365] as const;
export type InsightWindow = (typeof INSIGHT_WINDOWS)[number];

const TYPES = Object.keys(BLOOD_TYPE_LABELS) as BloodType[];

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

/** A count that is safe to show: 0 stays 0, a small number is hidden. */
export const safeCount = (n: number): number | null => (n === 0 || n >= MIN_GROUP ? n : null);

/** Monday 00:00 UTC of the week a date falls in, as YYYY-MM-DD. */
function weekKey(d: Date): string {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7));
  return x.toISOString().slice(0, 10);
}

export interface TypeRow {
  type: BloodType;
  label: string;
  registered: number;
  ready: number;
  requested: number;
  answered: number;
}
export interface CityRow {
  city: string;
  registered: number;
  ready: number;
  /** Ready donors per blood type; null when the number is too small to show. */
  byType: Record<string, number | null>;
}
export interface ResponseRow {
  label: string;
  alerts: number;
  answered: number;
  medianSeconds: number | null;
}

export async function getInsights(days: InsightWindow) {
  const since = new Date(Date.now() - days * DAY);
  const donors = { hospitalId: null, labId: null, onboardingComplete: true } as const;

  const [bloodGroups, cityRows, requests, drillRows, drillRuns] = await Promise.all([
    prisma.user.groupBy({
      by: ["bloodType", "isEligible"],
      where: { ...donors, bloodType: { not: null } },
      _count: { _all: true },
    }),
    // "Ho", "HO" and "ho " are one place.
    prisma.$queryRaw<{ city: string; bloodType: BloodType; total: number; ready: number }[]>`
      SELECT initcap(lower(btrim("city"))) AS city, "bloodType" AS "bloodType",
             count(*)::int AS total,
             count(*) FILTER (WHERE "isEligible")::int AS ready
      FROM "User"
      WHERE "onboardingComplete" = true AND "hospitalId" IS NULL AND "labId" IS NULL
        AND "bloodType" IS NOT NULL AND btrim(coalesce("city", '')) <> ''
      GROUP BY 1, 2`,
    prisma.bloodRequest.findMany({
      where: { isTest: false, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 5000,
      select: {
        bloodType: true,
        urgency: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        recipients: { select: { answer: true, answeredAt: true } },
      },
    }),
    prisma.drillResponse.findMany({
      where: { drill: { startedAt: { gte: since } } },
      take: 20000,
      select: { secondsToRespond: true },
    }),
    prisma.drill.findMany({
      where: { startedAt: { gte: since }, closedAt: { not: null } },
      take: 5000,
      select: { passed: true },
    }),
  ]);

  // ---- supply and demand by blood type
  const asked = new Map<BloodType, { n: number; yes: number }>();
  for (const r of requests) {
    const e = asked.get(r.bloodType) ?? { n: 0, yes: 0 };
    e.n++;
    if (secondsToFirstYes(r.createdAt, r.recipients) !== null) e.yes++;
    asked.set(r.bloodType, e);
  }
  const types: TypeRow[] = TYPES.map((type) => {
    const rows = bloodGroups.filter((g) => g.bloodType === type);
    return {
      type,
      label: BLOOD_TYPE_LABELS[type],
      registered: rows.reduce((s, r) => s + r._count._all, 0),
      ready: rows.find((r) => r.isEligible)?._count._all ?? 0,
      requested: asked.get(type)?.n ?? 0,
      answered: asked.get(type)?.yes ?? 0,
    };
  });

  // ---- supply by city
  const byCity = new Map<string, CityRow>();
  for (const r of cityRows) {
    const row = byCity.get(r.city) ?? { city: r.city, registered: 0, ready: 0, byType: {} };
    row.registered += r.total;
    row.ready += r.ready;
    row.byType[r.bloodType] = (row.byType[r.bloodType] ?? 0) + r.ready;
    byCity.set(r.city, row);
  }
  const cities: CityRow[] = [...byCity.values()]
    .map((c) => ({
      ...c,
      byType: Object.fromEntries(TYPES.map((t) => [t, safeCount(c.byType[t] ?? 0)])),
    }))
    .sort((a, b) => b.registered - a.registered || a.city.localeCompare(b.city))
    .slice(0, 12);

  // ---- response to real requests
  const firstYes = requests.map((r) => ({ r, s: secondsToFirstYes(r.createdAt, r.recipients) }));
  const answeredAll = firstYes.filter((x) => x.s !== null);
  const closedOut = requests.filter((r) => ["FULFILLED", "MATCHED"].includes(effectiveStatus(r)));
  const byUrgency: ResponseRow[] = (["CRITICAL", "URGENT", "STANDARD"] as const).map((u) => {
    const rows = firstYes.filter((x) => x.r.urgency === u);
    const yes = rows.filter((x) => x.s !== null);
    return { label: URGENCY_LABEL[u], alerts: rows.length, answered: yes.length, medianSeconds: median(yes.map((x) => x.s as number)) };
  });

  // ---- by week
  const weeks = new Map<string, { requests: number; answered: number }>();
  for (const x of firstYes) {
    const k = weekKey(x.r.createdAt);
    const e = weeks.get(k) ?? { requests: 0, answered: 0 };
    e.requests++;
    if (x.s !== null) e.answered++;
    weeks.set(k, e);
  }
  const weekly = [...weeks.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-13)
    .map(([k, v]) => ({
      label: new Date(k).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }),
      a: v.requests,
      b: v.answered,
    }));

  // ---- drills: how fast a Pod answers when nobody is hurt
  const passedDrills = drillRuns.filter((d) => d.passed).length;

  return {
    days,
    totals: {
      ready: types.reduce((s, t) => s + t.ready, 0),
      registered: types.reduce((s, t) => s + t.registered, 0),
      alerts: requests.length,
      answered: answeredAll.length,
      answerRate: pct(answeredAll.length, requests.length),
      closedOut: closedOut.length,
      medianSeconds: median(answeredAll.map((x) => x.s as number)),
    },
    types,
    cities,
    byUrgency,
    weekly,
    drills: {
      runs: drillRuns.length,
      passRate: pct(passedDrills, drillRuns.length),
      responses: drillRows.length,
      medianSeconds: median(drillRows.map((d) => d.secondsToRespond)),
    },
  };
}

export type Insights = Awaited<ReturnType<typeof getInsights>>;

/** 95 seconds -> "1m 35s"; 3 700 -> "1h 2m". */
export function duration(seconds: number | null): string {
  if (seconds === null) return "none yet";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}
