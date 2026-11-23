import { prisma } from "@/lib/prisma";
import { can, type EntitlementSubject, type Feature } from "@/lib/entitlements";

/**
 * Plan status is always read from the database, never from the client.
 * This is the one place pages and routes ask "does this person have this tool?".
 */
export async function entitlementSubject(userId: string): Promise<EntitlementSubject> {
  const subscriptions = await prisma.subscription.findMany({
    where: { userId },
    select: { plan: true, status: true, currentPeriodEnd: true },
  });
  return { subscriptions };
}

export async function userCan(userId: string, feature: Feature): Promise<boolean> {
  return can(await entitlementSubject(userId), feature);
}
