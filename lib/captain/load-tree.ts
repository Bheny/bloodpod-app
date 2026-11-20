import { prisma } from "@/lib/prisma";
import type { TreeMember, TreePod } from "@/lib/captain/types";

const MAX_DEPTH = 6; // levels go to 5, so six generations is all that is ever read

/**
 * The only place the Captain rules touch the database. It reads a Pod and everything that grew out of
 * it, and hands plain data to the pure functions in compute.ts.
 */
export async function loadTree(rootId: string, now: Date = new Date()): Promise<TreePod | null> {
  const byId = new Map<string, TreePod>();
  const parentOf = new Map<string, string>();
  let ids = [rootId];
  let root: TreePod | null = null;

  for (let depth = 0; depth < MAX_DEPTH && ids.length > 0; depth++) {
    const pods = await prisma.pod.findMany({
      where: { id: { in: ids } },
      include: {
        owner: { select: { id: true, phone: true, phoneVerifiedAt: true, isEligible: true, nextEligible: true } },
        members: {
          select: {
            joinedAt: true,
            user: { select: { id: true, phone: true, phoneVerifiedAt: true, isEligible: true, nextEligible: true } },
          },
        },
        drills: {
          where: { closedAt: { not: null } },
          select: { startedAt: true, eligibleCount: true, respondedCount: true },
        },
      },
    });

    const next: string[] = [];
    for (const p of pods) {
      const eligible = (u: { isEligible: boolean; nextEligible: Date | null }) => u.isEligible && (!u.nextEligible || u.nextEligible <= now);
      const toMember = (u: { id: string; phone: string | null; phoneVerifiedAt: Date | null; isEligible: boolean; nextEligible: Date | null }, joinedAt: Date): TreeMember => ({
        userId: u.id,
        phone: u.phone,
        phoneVerified: !!u.phoneVerifiedAt,
        eligible: eligible(u),
        joinedAt,
      });

      const tree: TreePod = {
        id: p.id,
        leaderId: p.owner.id,
        leaderPhone: p.owner.phone,
        leaderPhoneVerified: !!p.owner.phoneVerifiedAt,
        createdAt: p.createdAt,
        lastResponseAt: p.lastActivityAt,
        // The owner is not a PodMember row, so they are added here.
        members: [toMember(p.owner, p.createdAt), ...p.members.map((m) => toMember(m.user, m.joinedAt))],
        drills: p.drills.map((d) => ({ startedAt: d.startedAt, eligibleCount: d.eligibleCount, respondedInWindow: d.respondedCount })),
        children: [],
      };
      byId.set(p.id, tree);
      if (p.id === rootId) root = tree;
    }

    const kids = await prisma.pod.findMany({ where: { parentPodId: { in: ids } }, select: { id: true, parentPodId: true } });
    for (const k of kids) {
      if (byId.has(k.id) || parentOf.has(k.id)) continue; // a Pod can only appear once
      parentOf.set(k.id, k.parentPodId!);
      next.push(k.id);
    }
    ids = next;
  }

  for (const [childId, parentId] of parentOf) {
    const child = byId.get(childId);
    if (child) byId.get(parentId)?.children.push(child);
  }
  return root;
}
