import { BloodType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { recalculatePodStrength } from "@/lib/pod-strength";
import { BLOOD_TYPE_LABELS } from "@/lib/blood-type";
import { getAvatarColor, getAvatarTextColor, getInitials } from "@/lib/formatters";

export interface PodMemberView {
  id: string;
  name: string;
  initials: string;
  bgColor: string;
  textColor: string;
  bloodType: string | null;
  isEligible: boolean;
  nextEligible: Date | null;
  donationCount: number;
  isOwner: boolean;
  joinedAt: Date;
}

export interface PodDataResult {
  pod: {
    id: string;
    name: string;
    slug: string;
    createdAt: Date;
    memberCount: number;
    strengthScore: number;
    bloodTypesCovered: string[];
    bloodTypeGaps: string[];
    members: PodMemberView[];
  } | null;
  pendingInvites: {
    id: string;
    email: string | null;
    token: string;
    status: string;
    createdAt: Date;
    expiresAt: Date;
  }[];
}

export async function getPodData(userId: string): Promise<PodDataResult> {
  const pod = await prisma.pod.findFirst({
    where: { ownerId: userId },
    orderBy: { createdAt: "asc" },
    include: {
      owner: { include: { _count: { select: { donations: true } } } },
      members: {
        include: { user: { include: { _count: { select: { donations: true } } } } },
        orderBy: { joinedAt: "asc" },
      },
      invites: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!pod) return { pod: null, pendingInvites: [] };

  const { score } = await recalculatePodStrength(userId);

  const memberViews: PodMemberView[] = [
    {
      id: pod.owner.id,
      name: pod.owner.name ?? "You",
      initials: getInitials(pod.owner.name ?? "You"),
      bgColor: getAvatarColor(pod.owner.id),
      textColor: getAvatarTextColor(pod.owner.id),
      bloodType: pod.owner.bloodType ? BLOOD_TYPE_LABELS[pod.owner.bloodType] : null,
      isEligible: pod.owner.isEligible,
      nextEligible: pod.owner.nextEligible,
      donationCount: pod.owner._count.donations,
      isOwner: true,
      joinedAt: pod.createdAt,
    },
    ...pod.members.map((m) => ({
      id: m.user.id,
      name: m.user.name ?? "Pod member",
      initials: getInitials(m.user.name ?? "Pod member"),
      bgColor: getAvatarColor(m.user.id),
      textColor: getAvatarTextColor(m.user.id),
      bloodType: m.user.bloodType ? BLOOD_TYPE_LABELS[m.user.bloodType] : null,
      isEligible: m.user.isEligible,
      nextEligible: m.user.nextEligible,
      donationCount: m.user._count.donations,
      isOwner: false,
      joinedAt: m.joinedAt,
    })),
  ];

  const coveredTypes = new Set(
    [pod.owner.bloodType, ...pod.members.map((m) => m.user.bloodType)].filter(
      (bt): bt is BloodType => Boolean(bt),
    ),
  );
  const allTypes = Object.values(BloodType);
  const bloodTypesCovered = allTypes.filter((bt) => coveredTypes.has(bt)).map((bt) => BLOOD_TYPE_LABELS[bt]);
  const bloodTypeGaps = allTypes.filter((bt) => !coveredTypes.has(bt)).map((bt) => BLOOD_TYPE_LABELS[bt]);

  return {
    pod: {
      id: pod.id,
      name: pod.name,
      slug: pod.slug,
      createdAt: pod.createdAt,
      memberCount: memberViews.length,
      strengthScore: score,
      bloodTypesCovered,
      bloodTypeGaps,
      members: memberViews,
    },
    pendingInvites: pod.invites.map((inv) => ({
      id: inv.id,
      email: inv.email,
      token: inv.token,
      status: inv.status,
      createdAt: inv.createdAt,
      expiresAt: inv.expiresAt,
    })),
  };
}
