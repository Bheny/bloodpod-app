import { BloodType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { recalculatePodStrength, type PodStrengthStep } from "@/lib/pod-strength";
import { BLOOD_TYPE_LABELS } from "@/lib/blood-type";
import { getAvatarColor, getAvatarTextColor, getInitials } from "@/lib/formatters";

export interface PodMemberView {
  id: string;
  name: string;
  initials: string;
  bgColor: string;
  textColor: string;
  avatarUrl: string | null;
  bloodType: string | null;
  isEligible: boolean;
  nextEligible: Date | null;
  donationCount: number;
  isOwner: boolean;
  isCurrentUser: boolean;
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
    strengthSteps: PodStrengthStep[];
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

export interface JoinedPodSummary {
  id: string;
  name: string;
  ownerName: string;
  memberCount: number;
}

export interface JoinedPodDetail {
  id: string;
  name: string;
  ownerName: string;
  memberCount: number;
  bloodTypesCovered: string[];
  bloodTypeGaps: string[];
  members: PodMemberView[];
}

type UserWithDonationCount = {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  bloodType: BloodType | null;
  isEligible: boolean;
  nextEligible: Date | null;
  _count: { donations: number };
};

function buildMemberViews(
  pod: {
    owner: UserWithDonationCount;
    createdAt: Date;
    members: { user: UserWithDonationCount; joinedAt: Date }[];
  },
  viewerId: string,
): PodMemberView[] {
  return [
    {
      id: pod.owner.id,
      name: pod.owner.name ?? "Pod owner",
      initials: getInitials(pod.owner.name ?? "Pod owner"),
      bgColor: getAvatarColor(pod.owner.id),
      textColor: getAvatarTextColor(pod.owner.id),
      avatarUrl: pod.owner.avatarUrl,
      bloodType: pod.owner.bloodType ? BLOOD_TYPE_LABELS[pod.owner.bloodType] : null,
      isEligible: pod.owner.isEligible,
      nextEligible: pod.owner.nextEligible,
      donationCount: pod.owner._count.donations,
      isOwner: true,
      isCurrentUser: pod.owner.id === viewerId,
      joinedAt: pod.createdAt,
    },
    ...pod.members.map((m) => ({
      id: m.user.id,
      name: m.user.name ?? "Pod member",
      initials: getInitials(m.user.name ?? "Pod member"),
      bgColor: getAvatarColor(m.user.id),
      textColor: getAvatarTextColor(m.user.id),
      avatarUrl: m.user.avatarUrl,
      bloodType: m.user.bloodType ? BLOOD_TYPE_LABELS[m.user.bloodType] : null,
      isEligible: m.user.isEligible,
      nextEligible: m.user.nextEligible,
      donationCount: m.user._count.donations,
      isOwner: false,
      isCurrentUser: m.user.id === viewerId,
      joinedAt: m.joinedAt,
    })),
  ];
}

function bloodTypeCoverageFor(
  owner: { bloodType: BloodType | null },
  members: { user: { bloodType: BloodType | null } }[],
) {
  const coveredTypes = new Set(
    [owner.bloodType, ...members.map((m) => m.user.bloodType)].filter(
      (bt): bt is BloodType => Boolean(bt),
    ),
  );
  const allTypes = Object.values(BloodType);
  return {
    bloodTypesCovered: allTypes.filter((bt) => coveredTypes.has(bt)).map((bt) => BLOOD_TYPE_LABELS[bt]),
    bloodTypeGaps: allTypes.filter((bt) => !coveredTypes.has(bt)).map((bt) => BLOOD_TYPE_LABELS[bt]),
  };
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
      invites: { where: { kind: "DIRECT" }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!pod) return { pod: null, pendingInvites: [] };

  const strength = await recalculatePodStrength(userId);
  const memberViews = buildMemberViews(pod, userId);
  const { bloodTypesCovered, bloodTypeGaps } = bloodTypeCoverageFor(pod.owner, pod.members);

  return {
    pod: {
      id: pod.id,
      name: pod.name,
      slug: pod.slug,
      createdAt: pod.createdAt,
      memberCount: memberViews.length,
      strengthScore: strength.score,
      strengthSteps: strength.steps,
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

export async function getJoinedPods(userId: string): Promise<JoinedPodSummary[]> {
  const memberships = await prisma.podMember.findMany({
    where: { userId, pod: { ownerId: { not: userId } } },
    include: { pod: { include: { owner: true, _count: { select: { members: true } } } } },
    orderBy: { joinedAt: "desc" },
  });

  return memberships.map((m) => ({
    id: m.pod.id,
    name: m.pod.name,
    ownerName: m.pod.owner.name ?? "Pod owner",
    memberCount: m.pod._count.members + 1,
  }));
}

export async function getJoinedPodDetail(
  userId: string,
  podId: string,
): Promise<JoinedPodDetail | null> {
  const membership = await prisma.podMember.findUnique({
    where: { podId_userId: { podId, userId } },
  });
  if (!membership) return null;

  const pod = await prisma.pod.findUnique({
    where: { id: podId },
    include: {
      owner: { include: { _count: { select: { donations: true } } } },
      members: {
        include: { user: { include: { _count: { select: { donations: true } } } } },
        orderBy: { joinedAt: "asc" },
      },
    },
  });
  if (!pod) return null;

  const members = buildMemberViews(pod, userId);
  const { bloodTypesCovered, bloodTypeGaps } = bloodTypeCoverageFor(pod.owner, pod.members);

  return {
    id: pod.id,
    name: pod.name,
    ownerName: pod.owner.name ?? "Pod owner",
    memberCount: members.length,
    bloodTypesCovered,
    bloodTypeGaps,
    members,
  };
}
