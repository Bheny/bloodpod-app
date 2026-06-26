import { prisma } from "@/lib/prisma";
import { calculateStreak, calculateTier, nextEligibleDate } from "@/lib/passport";
import { BLOOD_TYPE_LABELS } from "@/lib/blood-type";

const TIER_THRESHOLDS = { STARTER: 5, VERIFIED: 25, LEGEND: 25 } as const;

export async function getPassportData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      donations: { orderBy: { donatedAt: "desc" } },
      _count: { select: { podMemberships: true } },
    },
  });

  if (!user) return null;

  const donationCount = user.donations.length;
  const tier = calculateTier(donationCount);
  const streak = calculateStreak(user.donations);
  const lastDonated = user.donations[0]?.donatedAt ?? null;
  const nextEligible = lastDonated ? nextEligibleDate(lastDonated) : null;
  const isEligible = !nextEligible || nextEligible <= new Date();

  const threshold = TIER_THRESHOLDS[tier];
  const tierProgress = {
    current: donationCount,
    next: Math.max(threshold - donationCount, 0),
    threshold,
  };

  return {
    user: {
      name: user.name,
      bloodType: user.bloodType ? BLOOD_TYPE_LABELS[user.bloodType] : null,
      city: user.city,
      avatarUrl: user.avatarUrl,
      podsJoined: user._count.podMemberships,
    },
    passport: {
      tier,
      tierProgress,
      donationCount,
      streak,
      lastDonated,
      nextEligible,
      isEligible,
      verificationStatus: donationCount > 0 ? "VERIFIED" : "UNVERIFIED",
      shareUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/passport/share`,
      qrCodeData: `bloodpod:${user.id}`,
    },
    donations: user.donations.map((d) => ({
      id: d.id,
      facility: d.facility,
      location: d.location,
      donatedAt: d.donatedAt,
      verified: d.verified,
      bloodType: BLOOD_TYPE_LABELS[d.bloodType],
      createdAt: d.createdAt,
    })),
  };
}

export type PassportData = NonNullable<Awaited<ReturnType<typeof getPassportData>>>;
