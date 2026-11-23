import { prisma } from "@/lib/prisma";
import { DRILL_FRESH_DAYS, gardenStage, gardenerTitle } from "@/lib/garden";
import { splitPeople } from "@/lib/readiness/members";
import { personSelect, toPodPerson } from "@/lib/readiness/people";

/**
 * Who is growing the biggest, best-tended Gardens. For the admin dashboard only.
 * It gives a first name for everyone except people who opted out; those come back with no name at all, so a
 * poster made from this can be shared without exposing anyone who asked to be left off.
 */

const DAY = 86_400_000;
const person = personSelect;

export type LeaderboardBy = "people" | "weeks";

export interface LeaderRow {
  userId: string;
  /** Null for anyone who opted out. Never fill it in for them. */
  name: string | null;
  /** False when the person asked to be left off. */
  named: boolean;
  plots: number;
  uniqueReady: number;
  weeks: number;
  stage: string;
  title: string | null;
}

export async function getLeaderboard(by: LeaderboardBy, limit = 15): Promise<LeaderRow[]> {
  const now = new Date();
  const since = new Date(now.getTime() - DRILL_FRESH_DAYS * DAY);

  const [pods, recentPasses, weekCounts, groveCounts] = await Promise.all([
    prisma.pod.findMany({
      take: 5000,
      select: {
        id: true,
        ownerId: true,
        createdAt: true,
        owner: { select: { ...person, gardenHidden: true } },
        members: { select: { joinedAt: true, user: { select: person } } },
      },
    }),
    prisma.drill.findMany({ where: { passed: true, closedAt: { gte: since } }, select: { pod: { select: { ownerId: true } } } }),
    prisma.tendedWeek.groupBy({ by: ["userId"], _count: { _all: true } }),
    prisma.tendedWeek.groupBy({ by: ["userId"], where: { stage: { gte: 3 } }, _count: { _all: true } }),
  ]);

  const drilled = new Set(recentPasses.map((d) => d.pod.ownerId));
  const weeks = new Map(weekCounts.map((w) => [w.userId, w._count._all]));
  const grove = new Map(groveCounts.map((w) => [w.userId, w._count._all]));

  const byOwner = new Map<string, typeof pods>();
  for (const p of pods) byOwner.set(p.ownerId, [...(byOwner.get(p.ownerId) ?? []), p]);

  const rows: LeaderRow[] = [];
  for (const [ownerId, owned] of byOwner) {
    const people = owned.flatMap((p) => [toPodPerson(p.owner, p.createdAt, now), ...p.members.map((m) => toPodPerson(m.user, m.joinedAt, now))]);
    const uniqueReady = splitPeople(people).counted.length;
    const w = weeks.get(ownerId) ?? 0;
    const owner = owned[0].owner;
    rows.push({
      userId: ownerId,
      name: owner.gardenHidden ? null : owner.name,
      named: !owner.gardenHidden && !!owner.name?.trim(),
      plots: owned.length,
      uniqueReady,
      weeks: w,
      stage: gardenStage(uniqueReady, drilled.has(ownerId)).name,
      title: gardenerTitle({ ownsPod: true, weeks: w, groveWeeks: grove.get(ownerId) ?? 0 }).title?.name ?? null,
    });
  }

  const key = (r: LeaderRow) => (by === "people" ? [r.uniqueReady, r.weeks] : [r.weeks, r.uniqueReady]);
  rows.sort((a, b) => {
    const [a1, a2] = key(a);
    const [b1, b2] = key(b);
    return b1 - a1 || b2 - a2 || a.userId.localeCompare(b.userId);
  });
  return rows.filter((r) => r.uniqueReady > 0 || r.weeks > 0).slice(0, limit);
}
