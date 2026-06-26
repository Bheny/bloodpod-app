import { prisma } from "@/lib/prisma";
import { getPodData } from "@/lib/pod-data";
import { getPassportData } from "@/lib/passport-data";
import { getRecentActivity } from "@/lib/activity";
import { BLOOD_TYPE_LABELS } from "@/lib/blood-type";

export async function getDashboardData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { _count: { select: { podMemberships: true } } },
  });
  if (!user) return null;

  const [{ pod }, passportData, recentActivity, openRequests] = await Promise.all([
    getPodData(userId),
    getPassportData(userId),
    getRecentActivity(userId, 5),
    user.bloodType
      ? prisma.bloodRequest.findMany({
          where: { bloodType: user.bloodType, status: "OPEN", requesterId: { not: userId } },
          include: { requester: true },
          orderBy: [{ urgency: "desc" }, { createdAt: "desc" }],
          take: 5,
        })
      : Promise.resolve([]),
  ]);

  return {
    user: {
      name: user.name,
      bloodType: user.bloodType ? BLOOD_TYPE_LABELS[user.bloodType] : null,
      city: user.city,
      isEligible: user.isEligible,
      nextEligible: user.nextEligible,
      podStrengthScore: user.podStrengthScore,
      onboardingComplete: user.onboardingComplete,
      plan: user.plan,
      podsJoined: user._count.podMemberships,
    },
    pod: pod
      ? {
          id: pod.id,
          name: pod.name,
          slug: pod.slug,
          memberCount: pod.memberCount,
          members: pod.members.slice(0, 5).map((m) => ({
            id: m.id,
            name: m.name,
            initials: m.initials,
            bgColor: m.bgColor,
            bloodType: m.bloodType,
            isEligible: m.isEligible,
            donationCount: m.donationCount,
          })),
          bloodTypesCovered: pod.bloodTypesCovered,
          bloodTypeGaps: pod.bloodTypeGaps,
        }
      : null,
    passport: passportData
      ? {
          donationCount: passportData.passport.donationCount,
          tier: passportData.passport.tier,
          streak: passportData.passport.streak,
          lastDonated: passportData.passport.lastDonated,
          nextEligible: passportData.passport.nextEligible,
          isEligible: passportData.passport.isEligible,
          verificationStatus: passportData.passport.verificationStatus,
        }
      : null,
    recentActivity,
    openRequests,
  };
}

export type DashboardData = NonNullable<Awaited<ReturnType<typeof getDashboardData>>>;
