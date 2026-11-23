import { prisma } from "@/lib/prisma";
import { getPodReadiness, type PodReadiness } from "@/lib/readiness/drill";
import { getSpinoffOffers } from "@/lib/readiness/spinoff";

export interface OwnedPodReadiness extends PodReadiness {
  podId: string;
  podName: string;
}

/** Everything /pod/ready needs for one person: the Pods they lead and any Pod they could start. */
export async function getReadinessOverview(userId: string) {
  const [owned, offers] = await Promise.all([
    prisma.pod.findMany({ where: { ownerId: userId }, orderBy: { createdAt: "asc" }, select: { id: true, name: true } }),
    getSpinoffOffers(userId),
  ]);
  const pods: OwnedPodReadiness[] = await Promise.all(
    owned.map(async (p) => ({ podId: p.id, podName: p.name, ...(await getPodReadiness(p.id)) })),
  );
  return { pods, offers };
}
