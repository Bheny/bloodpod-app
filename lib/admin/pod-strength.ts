import { Prisma } from "@prisma/client";
import { adb as prisma } from "@/lib/admin/db";
import { POD_READY_THRESHOLD } from "@/lib/admin/metrics";
import { READINESS } from "@/lib/readiness-config";
import { getGarden } from "@/lib/garden-data";

/**
 * Pod strength, for the admin Users list and a donor's detail page. Reading only: it never changes
 * who is alerted or in what order, and it names no one beyond the donor being looked at.
 *
 * In the list, strength is simple: how many people in the donor's best Pod can give right now, set
 * against the 3 that make a Pod ready to alert, the 5 a drill needs, and the 10 that make it complete. The detail page uses the
 * Garden's fuller plot score.
 */

export type StrengthKey = "none" | "member" | "building" | "ready" | "strong" | "complete";

export interface StrengthView {
  key: StrengthKey;
  label: string;
  tone: "gray" | "amber" | "blue" | "green";
  /** People who can give now, in the best Pod. */
  ready: number;
  /** People in that Pod, the owner included. */
  size: number;
  /** The next number to reach, or null when there is none. */
  target: number | null;
  pods: number;
}

/** Pure: where a donor stands, from what the best Pod looks like. */
export function podStrength(input: { owned: number; joined: number; ready: number; size: number }): StrengthView {
  const { owned, joined, ready, size } = input;
  const base = { ready, size, pods: owned };
  if (owned === 0) {
    return joined > 0
      ? { ...base, key: "member", label: "Member only", tone: "gray", target: null, ready: 0, size: 0 }
      : { ...base, key: "none", label: "No Pod yet", tone: "gray", target: POD_READY_THRESHOLD, ready: 0, size: 0 };
  }
  if (ready < POD_READY_THRESHOLD) return { ...base, key: "building", label: "Building", tone: "amber", target: POD_READY_THRESHOLD };
  if (ready < READINESS.drillMinEligible) return { ...base, key: "ready", label: "Ready", tone: "blue", target: READINESS.drillMinEligible };
  if (ready < READINESS.podComplete) return { ...base, key: "strong", label: "Strong", tone: "blue", target: READINESS.podComplete };
  return { ...base, key: "complete", label: "Complete", tone: "green", target: null };
}

/**
 * The fuller picture for one donor's detail page: each Pod they lead scored as a Garden plot, plus the
 * Garden's stage and their gardener title. Null if it cannot be read, so the page still opens.
 */
export async function getDonorPods(userId: string) {
  try {
    const g = await getGarden(userId);
    return {
      stage: g.stage.name,
      uniqueReady: g.uniqueReady,
      title: g.title.title?.name ?? null,
      weeks: g.weeks,
      tendedThisWeek: g.tendedThisWeek,
      plots: g.plots,
    };
  } catch {
    return null;
  }
}

type Row = { ownerId: string; id: string; size: number; ready: number };

/** For each donor on a page of the Users list, the strength of their best Pod. One query for the whole page. */
export async function getStrengthFor(users: { id: string; ownedPods: number; podMemberships: number }[]): Promise<Map<string, StrengthView>> {
  const owners = users.filter((u) => u.ownedPods > 0).map((u) => u.id);
  const best = new Map<string, Row>();

  if (owners.length > 0) {
    // Size is the owner plus members. Ready means a finished profile and able to give, as the readiness card counts it.
    const rows = await prisma.$queryRaw<Row[]>`
      SELECT p."ownerId" AS "ownerId", p.id,
             (1 + COUNT(pm.id))::int AS size,
             ((CASE WHEN o."onboardingComplete" AND o."isEligible" THEN 1 ELSE 0 END) +
               COALESCE(SUM(CASE WHEN u."onboardingComplete" AND u."isEligible" THEN 1 ELSE 0 END), 0))::int AS ready
      FROM "Pod" p
      JOIN "User" o ON o.id = p."ownerId"
      LEFT JOIN "PodMember" pm ON pm."podId" = p.id
      LEFT JOIN "User" u ON u.id = pm."userId"
      WHERE p."ownerId" IN (${Prisma.join(owners)})
      GROUP BY p."ownerId", p.id, o."onboardingComplete", o."isEligible"`;
    for (const r of rows) {
      const cur = best.get(r.ownerId);
      if (!cur || r.ready > cur.ready || (r.ready === cur.ready && r.size > cur.size)) best.set(r.ownerId, r);
    }
  }

  return new Map(
    users.map((u) => {
      const b = best.get(u.id);
      return [u.id, podStrength({ owned: u.ownedPods, joined: u.podMemberships, ready: b?.ready ?? 0, size: b?.size ?? 0 })];
    }),
  );
}
