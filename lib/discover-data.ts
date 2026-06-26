import { BloodType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BLOOD_TYPE_LABELS } from "@/lib/blood-type";
import { getAvatarColor, getAvatarTextColor, getInitials } from "@/lib/formatters";
import { haversineDistanceKm } from "@/lib/geo";

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
  bloodType: string | null;
  city: string | null;
  distanceKm: number | null;
  isEligible: boolean;
  nextEligible: Date | null;
  isAvailable: boolean;
  donationCount: number;
}

export interface DiscoverResult {
  donors: DiscoverDonor[];
  total: number;
  viewer: { city: string | null; bloodType: BloodType | null; isPublic: boolean };
}

/** First name + last initial — never expose a donor's full name to the discover feed. */
function privacyName(name: string | null): string {
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
      bloodType: u.bloodType ? BLOOD_TYPE_LABELS[u.bloodType] : null,
      city: u.city,
      distanceKm,
      isEligible: u.isEligible,
      nextEligible: u.nextEligible,
      isAvailable: u.isAvailable,
      donationCount: u._count.donations,
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
