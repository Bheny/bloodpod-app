import { adb as prisma } from "@/lib/admin/db";
import { pct } from "@/lib/admin/format";
import type { SeriesPoint } from "@/lib/admin/metrics";

const DAY = 86_400_000;

/** Start of a UTC day, n days back. Page views are stored in UTC, which is Accra time. */
function dayStart(daysBack: number): Date {
  const d = new Date(Date.now() - daysBack * DAY);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function fill(rows: { day: string; n: number }[], days: number): SeriesPoint[] {
  const byDay = new Map(rows.map((r) => [r.day, r.n]));
  const out: SeriesPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = dayStart(i);
    const key = d.toISOString().slice(0, 10);
    out.push({
      date: key,
      label: d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }),
      value: byDay.get(key) ?? 0,
    });
  }
  return out;
}

type Window = { visitors: number; views: number; visits: number; members: number; installed: number; bounced: number };

async function windowStats(from: Date, to: Date): Promise<Window> {
  const [row] = await prisma.$queryRaw<
    { visitors: number; views: number; visits: number; members: number; installed: number }[]
  >`
    SELECT
      count(DISTINCT "visitorId")::int AS visitors,
      count(*)::int AS views,
      count(DISTINCT "sessionId")::int AS visits,
      count(DISTINCT "userId")::int AS members,
      count(DISTINCT "visitorId") FILTER (WHERE "installed")::int AS installed
    FROM "PageView" WHERE "at" >= ${from} AND "at" < ${to}`;
  const [b] = await prisma.$queryRaw<{ n: number }[]>`
    SELECT count(*)::int AS n FROM (
      SELECT "sessionId" FROM "PageView" WHERE "at" >= ${from} AND "at" < ${to}
      GROUP BY "sessionId" HAVING count(*) = 1
    ) s`;
  return { ...row, bounced: b?.n ?? 0 };
}

export async function getAnalytics(days: number) {
  const now = new Date();
  const from = dayStart(days - 1);
  const prevFrom = new Date(from.getTime() - days * DAY);

  const [
    current,
    previous,
    tracking,
    live,
    members,
    seriesVisitors,
    seriesViews,
    newVsReturning,
    pages,
    areas,
    sources,
    landings,
    devices,
    countries,
    cities,
    hours,
    signUp,
    accounts,
  ] = await Promise.all([
    windowStats(from, now),
    windowStats(prevFrom, from),
    prisma.$queryRaw<{ first: Date | null }[]>`SELECT min("at") AS first FROM "PageView"`,
    prisma.$queryRaw<{ five: number; thirty: number; fiveMembers: number }[]>`
      SELECT
        count(DISTINCT "visitorId") FILTER (WHERE "at" >= now() - interval '5 minutes')::int AS five,
        count(DISTINCT "visitorId") FILTER (WHERE "at" >= now() - interval '30 minutes')::int AS thirty,
        count(DISTINCT "userId") FILTER (WHERE "at" >= now() - interval '5 minutes')::int AS "fiveMembers"
      FROM "PageView" WHERE "at" >= now() - interval '30 minutes'`,
    prisma.$queryRaw<{ dau: number; wau: number; mau: number }[]>`
      SELECT
        count(DISTINCT "userId") FILTER (WHERE "at" >= now() - interval '1 day')::int AS dau,
        count(DISTINCT "userId") FILTER (WHERE "at" >= now() - interval '7 days')::int AS wau,
        count(DISTINCT "userId")::int AS mau
      FROM "PageView" WHERE "userId" IS NOT NULL AND "at" >= now() - interval '30 days'`,
    prisma.$queryRaw<{ day: string; n: number }[]>`
      SELECT to_char(date_trunc('day', "at"), 'YYYY-MM-DD') AS day, count(DISTINCT "visitorId")::int AS n
      FROM "PageView" WHERE "at" >= ${from} GROUP BY 1 ORDER BY 1`,
    prisma.$queryRaw<{ day: string; n: number }[]>`
      SELECT to_char(date_trunc('day', "at"), 'YYYY-MM-DD') AS day, count(*)::int AS n
      FROM "PageView" WHERE "at" >= ${from} GROUP BY 1 ORDER BY 1`,
    // A visitor is new when their very first page view falls inside the window.
    prisma.$queryRaw<{ fresh: number; returning: number }[]>`
      SELECT
        count(*) FILTER (WHERE first >= ${from})::int AS fresh,
        count(*) FILTER (WHERE first < ${from})::int AS returning
      FROM (
        SELECT "visitorId", min("at") AS first, max("at") AS last FROM "PageView" GROUP BY 1
      ) v WHERE last >= ${from}`,
    prisma.$queryRaw<{ path: string; views: number; visitors: number }[]>`
      SELECT "path", count(*)::int AS views, count(DISTINCT "visitorId")::int AS visitors
      FROM "PageView" WHERE "at" >= ${from} GROUP BY 1 ORDER BY 2 DESC LIMIT 12`,
    // Signed-in use by area of the app: the first part of the path.
    prisma.$queryRaw<{ area: string; views: number; members: number }[]>`
      SELECT split_part("path", '/', 2) AS area, count(*)::int AS views, count(DISTINCT "userId")::int AS members
      FROM "PageView" WHERE "at" >= ${from} AND "userId" IS NOT NULL AND "path" <> '/'
      GROUP BY 1 ORDER BY 3 DESC, 2 DESC LIMIT 12`,
    prisma.$queryRaw<{ source: string; visits: number }[]>`
      SELECT coalesce("source", 'direct') AS source, count(*)::int AS visits
      FROM "PageView" WHERE "at" >= ${from} AND "entry" GROUP BY 1 ORDER BY 2 DESC LIMIT 10`,
    prisma.$queryRaw<{ path: string; visits: number }[]>`
      SELECT "path", count(*)::int AS visits
      FROM "PageView" WHERE "at" >= ${from} AND "entry" GROUP BY 1 ORDER BY 2 DESC LIMIT 6`,
    prisma.$queryRaw<{ device: string; visitors: number }[]>`
      SELECT "device", count(DISTINCT "visitorId")::int AS visitors
      FROM "PageView" WHERE "at" >= ${from} GROUP BY 1 ORDER BY 2 DESC`,
    prisma.$queryRaw<{ country: string; visitors: number }[]>`
      SELECT "country", count(DISTINCT "visitorId")::int AS visitors
      FROM "PageView" WHERE "at" >= ${from} AND "country" IS NOT NULL GROUP BY 1 ORDER BY 2 DESC LIMIT 6`,
    prisma.$queryRaw<{ city: string; visitors: number }[]>`
      SELECT "city", count(DISTINCT "visitorId")::int AS visitors
      FROM "PageView" WHERE "at" >= ${from} AND "city" IS NOT NULL AND "country" = 'GH' GROUP BY 1 ORDER BY 2 DESC LIMIT 8`,
    prisma.$queryRaw<{ hour: number; n: number }[]>`
      SELECT extract(hour from "at")::int AS hour, count(*)::int AS n
      FROM "PageView" WHERE "at" >= ${from} GROUP BY 1 ORDER BY 1`,
    prisma.$queryRaw<{ n: number }[]>`
      SELECT count(DISTINCT "visitorId")::int AS n FROM "PageView"
      WHERE "at" >= ${from} AND "path" IN ('/start', '/sign-up')`,
    prisma.$queryRaw<{ created: number; finished: number }[]>`
      SELECT count(*)::int AS created, count(*) FILTER (WHERE "onboardingComplete")::int AS finished
      FROM "User" WHERE "hospitalId" IS NULL AND "createdAt" >= ${from}`,
  ]);

  const trackingSince = tracking[0]?.first ?? null;
  const l = live[0] ?? { five: 0, thirty: 0, fiveMembers: 0 };
  const m = members[0] ?? { dau: 0, wau: 0, mau: 0 };
  const nr = newVsReturning[0] ?? { fresh: 0, returning: 0 };

  const hourly = Array.from({ length: 24 }, (_, h) => ({
    label: String(h).padStart(2, "0"),
    value: hours.find((r) => r.hour === h)?.n ?? 0,
  }));

  // Each step is shown against the first; a step can never be bigger than the one above it.
  const top = current.visitors;
  const step = (key: string, label: string, value: number, prev: number) => ({
    key,
    label,
    value: Math.min(value, prev),
    ofFirst: pct(Math.min(value, prev), top),
    ofPrev: pct(Math.min(value, prev), prev),
  });
  const opened = Math.min(signUp[0]?.n ?? 0, top);
  const created = Math.min(accounts[0]?.created ?? 0, opened);
  const finished = Math.min(accounts[0]?.finished ?? 0, created);
  const funnel = [
    { key: "visit", label: "Visited BloodPod", value: top, ofFirst: top ? 100 : 0, ofPrev: 100 },
    step("open", "Opened sign-up", opened, top),
    step("account", "Made an account", created, opened),
    step("ready", "Finished setting up", finished, created),
  ];

  return {
    days,
    trackingSince,
    current,
    previous,
    pagesPerVisit: current.visits ? Math.round((current.views / current.visits) * 10) / 10 : 0,
    bounceRate: pct(current.bounced, current.visits),
    installedShare: pct(current.installed, current.visitors),
    live: { now: l.five, last30: l.thirty, membersNow: l.fiveMembers },
    members: { dau: m.dau, wau: m.wau, mau: m.mau, stickiness: pct(m.dau, m.mau) },
    visitorsSeries: fill(seriesVisitors, days),
    viewsSeries: fill(seriesViews, days),
    fresh: nr.fresh,
    returning: nr.returning,
    pages,
    areas,
    sources,
    landings,
    devices,
    countries,
    cities,
    hourly,
    funnel,
  };
}

/**
 * Of the people who made an account in a given week, how many came back in the weeks after.
 * Only weeks since counting began are shown: before that nobody's visits were recorded, so every cohort would read as zero.
 */
export async function getRetention(trackingSince: Date | null) {
  if (!trackingSince) return [];
  const weekMs = 7 * DAY;
  const thisWeek = new Date();
  thisWeek.setUTCHours(0, 0, 0, 0);
  thisWeek.setUTCDate(thisWeek.getUTCDate() - ((thisWeek.getUTCDay() + 6) % 7));
  const earliest = new Date(Math.max(thisWeek.getTime() - 5 * weekMs, trackingSince.getTime()));
  earliest.setUTCHours(0, 0, 0, 0);
  earliest.setUTCDate(earliest.getUTCDate() - ((earliest.getUTCDay() + 6) % 7));

  const rows = await prisma.$queryRaw<{ cohort: string; size: number; week: number | null; back: number }[]>`
    WITH c AS (
      SELECT "id", date_trunc('week', "createdAt") AS wk FROM "User"
      WHERE "hospitalId" IS NULL AND "createdAt" >= ${earliest}
    ),
    a AS (
      SELECT DISTINCT "userId", date_trunc('week', "at") AS wk FROM "PageView"
      WHERE "userId" IS NOT NULL AND "at" >= ${earliest}
    )
    SELECT to_char(c.wk, 'YYYY-MM-DD') AS cohort,
           (SELECT count(*)::int FROM c c2 WHERE c2.wk = c.wk) AS size,
           (extract(epoch from (a.wk - c.wk)) / 604800)::int AS week,
           count(DISTINCT c.id)::int AS back
    FROM c LEFT JOIN a ON a."userId" = c.id AND a.wk >= c.wk
    GROUP BY c.wk, a.wk ORDER BY c.wk, a.wk`;

  const sizes = new Map<string, number>();
  const grid = new Map<string, Map<number, number>>();
  for (const r of rows) {
    sizes.set(r.cohort, r.size);
    if (!grid.has(r.cohort)) grid.set(r.cohort, new Map());
    if (r.week !== null) grid.get(r.cohort)!.set(r.week, r.back);
  }
  const currentWeek = (w: string) => Math.floor((thisWeek.getTime() - new Date(w).getTime()) / weekMs);

  return [...sizes.entries()].map(([cohort, size]) => ({
    cohort,
    size,
    // null for weeks that have not happened yet
    weeks: Array.from({ length: 5 }, (_, w) => (w > currentWeek(cohort) ? null : pct(grid.get(cohort)?.get(w) ?? 0, size))),
  }));
}

/** Cron: drop views older than the retention window. */
export async function prunePageViews(days: number) {
  const cutoff = new Date(Date.now() - days * DAY);
  return prisma.$executeRaw`DELETE FROM "PageView" WHERE "at" < ${cutoff}`;
}
