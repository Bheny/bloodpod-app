import { prisma } from "@/lib/prisma";

/** Every donor leads one Pod. Joining other people's Pods is never limited. */
export const OWNED_POD_LIMIT = 1;

export interface PodAllowance {
  owned: number;
  limit: number;
  /** True only for someone who does not lead a Pod yet. */
  canCreate: boolean;
}

export async function getPodAllowance(userId: string): Promise<PodAllowance> {
  const owned = await prisma.pod.count({ where: { ownerId: userId } });
  return { owned, limit: OWNED_POD_LIMIT, canCreate: owned < OWNED_POD_LIMIT };
}
