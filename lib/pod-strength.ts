import { prisma } from "@/lib/prisma";
import { calculateTier } from "@/lib/passport";

export interface PodStrengthStep {
  id: string;
  label: string;
  complete: boolean;
  ctaRoute: string;
}

export interface PodStrengthResult {
  score: number;
  steps: PodStrengthStep[];
  podName: string | null;
}

export async function recalculatePodStrength(userId: string): Promise<PodStrengthResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      ownedPods: { include: { members: true }, orderBy: { createdAt: "asc" }, take: 1 },
      donations: true,
    },
  });

  if (!user) return { score: 0, steps: [], podName: null };

  const pod = user.ownedPods[0] ?? null;
  const hasBloodType = Boolean(user.bloodType);
  const hasProfile = Boolean(user.name) && Boolean(user.city);
  const hasMember = Boolean(pod) && pod!.members.length > 0;
  const hasDonation = user.donations.length > 0;

  const steps: PodStrengthStep[] = [
    {
      id: "blood-type",
      label: "Add your blood type",
      complete: hasBloodType,
      ctaRoute: "/profile/edit",
    },
    {
      id: "profile",
      label: "Complete your profile",
      complete: hasProfile,
      ctaRoute: "/profile/edit",
    },
    {
      id: "invite",
      label: "Invite your first member",
      complete: hasMember,
      ctaRoute: "/pod/invite",
    },
    {
      id: "availability",
      label: "Turn on availability",
      complete: user.isAvailable,
      ctaRoute: "/profile",
    },
    {
      id: "donation",
      label: "Log your first donation",
      complete: hasDonation,
      ctaRoute: "/passport/log",
    },
  ];

  const score = steps.filter((s) => s.complete).length * 20;
  const passportTier = calculateTier(user.donations.length);

  await prisma.user.update({
    where: { id: userId },
    data: { podStrengthScore: score, passportTier },
  });

  return { score, steps, podName: pod?.name ?? null };
}
