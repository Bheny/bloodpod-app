import { BloodType, type PassportTier } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BLOOD_TYPE_LABELS } from "@/lib/blood-type";
import { getAvatarColor, getAvatarTextColor, getInitials } from "@/lib/formatters";
import { haversineDistanceKm } from "@/lib/geo";
import { calculateTier } from "@/lib/passport";
import { canDonateTo } from "@/lib/blood-compatibility";

const RESULT_LIMIT = 30;
const CANDIDATE_LIMIT = 200;

export interface DiscoverFilters {
  bloodType?: BloodType;
  city?: string;
  eligibleOnly?: boolean;
}

export interface DiscoverDonor {
  id: string;
  displayName: string;
  initials: string;
  bgColor: string;
  textColor: string;
  avatarUrl: string | null;
  bloodType: string | null;
  city: string | null;
  distanceKm: number | null;
  isEligible: boolean;
  nextEligible: Date | null;
  isAvailable: boolean;
  donationCount: number;
  tier: PassportTier;
  /** Can this donor's blood type safely go to the viewer's? Undisclosed elsewhere - purely a quiet visual cue. */
  isCompatibleMatch: boolean;
}

export interface DiscoverResult {
  donors: DiscoverDonor[];
  total: number;
  viewer: { city: string | null; bloodType: BloodType | null; isPublic: boolean };
}

export interface DonorDetail extends DiscoverDonor {
  memberSince: Date;
}

/** First name + last initial — never expose a donor's full name to the discover feed. */
export function privacyName(name: string | null): string {
  if (!name) return "Anonymous donor";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

export async function getDiscoverDonors(
  viewerId: string,
  filters: DiscoverFilters,
): Promise<DiscoverResult | null> {
  const viewer = await prisma.user.findUnique({ where: { id: viewerId } });
  if (!viewer) return null;

  const candidates = await prisma.user.findMany({
    where: {
      id: { not: viewerId },
      isPublic: true,
      bloodType: filters.bloodType ?? undefined,
      city: filters.city ? { contains: filters.city, mode: "insensitive" } : undefined,
      isEligible: filters.eligibleOnly ? true : undefined,
    },
    include: { _count: { select: { donations: true } } },
    take: CANDIDATE_LIMIT,
  });

  const hasViewerLocation = viewer.latitude !== null && viewer.longitude !== null;

  const donors: DiscoverDonor[] = candidates.map((u) => {
    const distanceKm =
      hasViewerLocation && u.latitude !== null && u.longitude !== null
        ? haversineDistanceKm(viewer.latitude!, viewer.longitude!, u.latitude, u.longitude)
        : null;

    return {
      id: u.id,
      displayName: privacyName(u.name),
      initials: getInitials(u.name ?? "?"),
      bgColor: getAvatarColor(u.id),
      textColor: getAvatarTextColor(u.id),
      avatarUrl: u.avatarUrl,
      bloodType: u.bloodType ? BLOOD_TYPE_LABELS[u.bloodType] : null,
      city: u.city,
      distanceKm,
      isEligible: u.isEligible,
      nextEligible: u.nextEligible,
      isAvailable: u.isAvailable,
      donationCount: u._count.donations,
      tier: calculateTier(u._count.donations),
      isCompatibleMatch:
        u.bloodType !== null && viewer.bloodType !== null
          ? canDonateTo(u.bloodType, viewer.bloodType)
          : false,
    };
  });

  donors.sort((a, b) => {
    if (a.isEligible !== b.isEligible) return a.isEligible ? -1 : 1;
    if (a.distanceKm !== null && b.distanceKm !== null) return a.distanceKm - b.distanceKm;
    if (a.distanceKm !== null) return -1;
    if (b.distanceKm !== null) return 1;
    return b.donationCount - a.donationCount;
  });

  return {
    donors: donors.slice(0, RESULT_LIMIT),
    total: donors.length,
    viewer: { city: viewer.city, bloodType: viewer.bloodType, isPublic: viewer.isPublic },
  };
}

/** Public profile view for a single donor - only ever exposes what the Discover list already shows. */
export async function getDonorDetail(
  donorId: string,
  viewerId: string,
): Promise<DonorDetail | null> {
  const donor = await prisma.user.findUnique({
    where: { id: donorId },
    include: { _count: { select: { donations: true } } },
  });
  if (!donor || !donor.isPublic) return null;

  const viewer = donorId === viewerId ? donor : await prisma.user.findUnique({ where: { id: viewerId } });
  if (!viewer) return null;

  const distanceKm =
    viewer.latitude !== null &&
    viewer.longitude !== null &&
    donor.latitude !== null &&
    donor.longitude !== null
      ? haversineDistanceKm(viewer.latitude, viewer.longitude, donor.latitude, donor.longitude)
      : null;

  return {
    id: donor.id,
    displayName: privacyName(donor.name),
    initials: getInitials(donor.name ?? "?"),
    bgColor: getAvatarColor(donor.id),
    textColor: getAvatarTextColor(donor.id),
    avatarUrl: donor.avatarUrl,
    bloodType: donor.bloodType ? BLOOD_TYPE_LABELS[donor.bloodType] : null,
    city: donor.city,
    distanceKm,
    isEligible: donor.isEligible,
    nextEligible: donor.nextEligible,
    isAvailable: donor.isAvailable,
    donationCount: donor._count.donations,
    tier: calculateTier(donor._count.donations),
    isCompatibleMatch:
      donor.bloodType !== null && viewer.bloodType !== null
        ? canDonateTo(donor.bloodType, viewer.bloodType)
        : false,
    memberSince: donor.createdAt,
  };
}
