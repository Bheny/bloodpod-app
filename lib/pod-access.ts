import { prisma } from "@/lib/prisma";
import { ownedPodLimit } from "@/lib/pod-limits";

/** Paid means the legacy PREMIUM flag, or a Care/Case subscription that has not run out. */
async function isPaid(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      subscriptions: {
        where: { status: { not: "EXPIRED" }, currentPeriodEnd: { gt: new Date() } },
        select: { id: true },
        take: 1,
      },
    },
  });
  if (!user) return false;
  return user.plan === "PREMIUM" || user.subscriptions.length > 0;
}

export interface PodAllowance {
  owned: number;
  limit: number;
  canCreate: boolean;
}

export async function getPodAllowance(userId: string): Promise<PodAllowance> {
  const [owned, paid] = await Promise.all([prisma.pod.count({ where: { ownerId: userId } }), isPaid(userId)]);
  const limit = ownedPodLimit(paid);
  return { owned, limit, canCreate: owned < limit };
}
