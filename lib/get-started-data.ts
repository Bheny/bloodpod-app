import { prisma } from "@/lib/prisma";
import { computeSteps, progressOf, type Progress, type StepState } from "@/lib/get-started";

export interface GetStartedState extends Progress {
  steps: StepState[];
  /** They hid the card from Home. The full list is still on /get-started. */
  dismissed: boolean;
}

interface Who {
  id: string;
  bloodType: unknown;
  isPublic: boolean;
  emergencyContactPhone: string | null;
  getStartedSeen: string[];
  getStartedDismissedAt: Date | null;
}

/** Reads what the person has really done. Runs on the server, so the client cannot say a step is finished. */
export async function getGetStartedState(user: Who): Promise<GetStartedState> {
  const [pushCount, invited, drillsRun, donationCount] = await Promise.all([
    prisma.pushSubscription.count({ where: { userId: user.id } }),
    prisma.podMember.findMany({
      where: { pod: { ownerId: user.id }, userId: { not: user.id } },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.drill.count({ where: { startedById: user.id } }),
    prisma.donation.count({ where: { userId: user.id } }),
  ]);

  const steps = computeSteps(
    {
      hasBloodType: user.bloodType != null,
      hasPush: pushCount > 0,
      invitedCount: invited.length,
      drillsRun,
      isPublic: user.isPublic,
      hasEmergencyContact: Boolean(user.emergencyContactPhone?.trim()),
      donationCount,
    },
    user.getStartedSeen,
  );

  return { ...progressOf(steps), steps, dismissed: user.getStartedDismissedAt != null };
}
