import { prisma } from "@/lib/prisma";
import { computeCaptainLevel, uniqueDonorCount } from "@/lib/captain/compute";
import { loadTree } from "@/lib/captain/load-tree";
import { visibleBadge } from "@/lib/captain/promotion";
import { lapseStage } from "@/lib/captain/lapse";
import { getSpinoffOffers } from "@/lib/captain/spinoff";
import type { CaptainResult, ChildState, TreePod } from "@/lib/captain/types";

/** What the Captain screens show. All reading, no rules: the rules live in compute.ts. */

export type Health = "working" | "needs_people" | "quiet" | "check";

export interface LineageNode {
  podId: string;
  name: string;
  leaderName: string | null;
  health: Health;
  level: number | null;
  children: LineageNode[];
}

const HEALTH: Record<ChildState["reason"], Health> = {
  ok: "working",
  needs_members: "needs_people",
  needs_activity: "quiet",
  same_person: "check",
};

export interface PodProgress {
  podId: string;
  podName: string;
  result: CaptainResult;
  lineage: LineageNode[];
  /** Every Pod that has grown out of this one, at any depth. */
  grownCount: number;
  uniqueDonors: number;
  lastDrill: { id: string; startedAt: Date; closedAt: Date | null; passed: boolean | null; eligibleCount: number; respondedCount: number } | null;
}

function everyDescendant(p: TreePod): TreePod[] {
  return p.children.flatMap((c) => [c, ...everyDescendant(c)]);
}

export async function getPodProgress(podId: string, now = new Date()): Promise<PodProgress | null> {
  const tree = await loadTree(podId, now);
  if (!tree) return null;

  const all = [tree, ...everyDescendant(tree)];
  const pods = await prisma.pod.findMany({
    where: { id: { in: all.map((p) => p.id) } },
    select: { id: true, name: true, owner: { select: { name: true } } },
  });
  const names = new Map(pods.map((p) => [p.id, p]));

  const build = (pod: TreePod, health: Health): LineageNode => {
    const r = computeCaptainLevel(pod, now);
    return {
      podId: pod.id,
      name: names.get(pod.id)?.name ?? "A Pod",
      leaderName: names.get(pod.id)?.owner.name ?? null,
      health,
      level: r.level,
      children: r.children.map((cs) => build(pod.children.find((c) => c.id === cs.podId)!, HEALTH[cs.reason])),
    };
  };

  const result = computeCaptainLevel(tree, now);
  const lastDrill = await prisma.drill.findFirst({
    where: { podId },
    orderBy: { startedAt: "desc" },
    select: { id: true, startedAt: true, closedAt: true, passed: true, eligibleCount: true, respondedCount: true },
  });

  return {
    podId,
    podName: names.get(podId)?.name ?? "Your Pod",
    result,
    lineage: result.children.map((cs) => build(tree.children.find((c) => c.id === cs.podId)!, HEALTH[cs.reason])),
    grownCount: all.length - 1,
    uniqueDonors: uniqueDonorCount(tree),
    lastDrill,
  };
}

/** Everything the /captain screen needs for one person. */
export async function getCaptainOverview(userId: string) {
  const [owned, status, offers] = await Promise.all([
    prisma.pod.findMany({ where: { ownerId: userId }, orderBy: { createdAt: "asc" }, select: { id: true } }),
    prisma.captainStatus.findUnique({ where: { userId } }),
    getSpinoffOffers(userId),
  ]);
  const progress = (await Promise.all(owned.map((p) => getPodProgress(p.id)))).filter((p): p is PodProgress => !!p);

  // The Pod furthest along leads the page.
  progress.sort((a, b) => (b.result.level ?? -1) - (a.result.level ?? -1) || b.grownCount - a.grownCount);

  return {
    progress,
    badge: visibleBadge(status),
    awaitingPledge: !!status && status.approvedLevel !== null && !status.pledgeAcceptedAt,
    approvedLevel: status?.approvedLevel ?? null,
    lapse: status?.lapseStartedAt ? lapseStage(status.lapseStartedAt) : null,
    offers,
  };
}

/** For headers and profile: just the badge, cheap. */
export async function getBadgeFor(userId: string) {
  const status = await prisma.captainStatus.findUnique({ where: { userId }, select: { approvedLevel: true, pledgeAcceptedAt: true } });
  return visibleBadge(status);
}
