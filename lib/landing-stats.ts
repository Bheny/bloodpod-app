import { prisma } from "@/lib/prisma";

export interface LandingStats {
  /** People who finished setting up and gave a blood type. */
  people: number;
  /** Pods created. */
  pods: number;
  /** How many of the 8 blood types have at least one donor who is ready right now. */
  typesCovered: number;
}

/**
 * Real numbers only. In production a number is shown once it reaches its minimum, so a tiny
 * count never undersells you. In development every number shows, whatever its size, so you can
 * see the design. Change a minimum here when you want a number to appear sooner or later.
 */
export const STAT_MINIMUMS = { people: 50, pods: 10, typesCovered: 6 } as const;

export function isVisible(value: number, min: number): boolean {
  return process.env.NODE_ENV !== "production" || value >= min;
}

/** Null if the database can't be reached, so the page still builds and renders without it. */
export async function getLandingStats(): Promise<LandingStats | null> {
  try {
    const donors = { onboardingComplete: true, bloodType: { not: null }, hospitalId: null, labId: null } as const;
    const [people, pods, ready] = await Promise.all([
      prisma.user.count({ where: donors }),
      prisma.pod.count(),
      prisma.user.groupBy({
        by: ["bloodType"],
        where: { ...donors, isEligible: true, isAvailable: true },
      }),
    ]);
    return { people, pods, typesCovered: ready.length };
  } catch (err) {
    console.error("[landing] stats unavailable", err);
    return null;
  }
}
