import { BloodType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BLOOD_TYPE_LABELS } from "@/lib/blood-type";
import { haversineDistanceKm } from "@/lib/geo";
import { canDonateTo } from "@/lib/blood-compatibility";

const RESULT_LIMIT = 60;
const CANDIDATE_LIMIT = 300;

/**
 * Donor positions are snapped to the middle of a ~2 km grid square before they leave the
 * server, and distances are measured to that point. Nobody's real position is ever sent,
 * so a search can't be used to pin a person down.
 */
const GRID_DEG = 0.02;
const snap = (v: number) => Math.floor(v / GRID_DEG) * GRID_DEG + GRID_DEG / 2;

export interface DiscoverFilters {
  bloodType?: BloodType;
  city?: string;
  eligibleOnly?: boolean;
}

/** All a search result says about a person: blood type, rough place, rough distance. */
export interface DiscoverDonor {
  /** Position in the result, only for list keys. Not a user id. */
  key: string;
  bloodType: string | null;
  city: string | null;
  distanceKm: number | null;
  /** Centre of the ~2 km square they're in (for the map). */
  lat: number;
  lng: number;
  /** Squares are shared, so the map can group everyone in one. */
  cell: string;
  /** Can this person's blood go to the viewer? A quiet cue only. */
  isCompatibleMatch: boolean;
}

export interface DiscoverResult {
  donors: DiscoverDonor[];
  total: number;
  viewer: { city: string | null; bloodType: BloodType | null; isPublic: boolean; lat: number | null; lng: number | null };
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
      // Only people with a position can be shown on a map.
      latitude: { not: null },
      longitude: { not: null },
      bloodType: filters.bloodType ?? undefined,
      city: filters.city ? { contains: filters.city, mode: "insensitive" } : undefined,
      isEligible: filters.eligibleOnly ? true : undefined,
    },
    select: { bloodType: true, city: true, latitude: true, longitude: true },
    take: CANDIDATE_LIMIT,
  });

  const hasViewerLocation = viewer.latitude !== null && viewer.longitude !== null;

  const donors = candidates.map((u) => {
    const lat = snap(u.latitude as number);
    const lng = snap(u.longitude as number);
    return {
      bloodType: u.bloodType ? BLOOD_TYPE_LABELS[u.bloodType] : null,
      city: u.city,
      distanceKm: hasViewerLocation ? haversineDistanceKm(viewer.latitude!, viewer.longitude!, lat, lng) : null,
      lat,
      lng,
      cell: `${lat.toFixed(2)},${lng.toFixed(2)}`,
      isCompatibleMatch:
        u.bloodType !== null && viewer.bloodType !== null ? canDonateTo(u.bloodType, viewer.bloodType) : false,
    };
  });

  donors.sort((a, b) => {
    if (a.distanceKm !== null && b.distanceKm !== null) return a.distanceKm - b.distanceKm;
    if (a.distanceKm !== null) return -1;
    if (b.distanceKm !== null) return 1;
    return 0;
  });

  return {
    donors: donors.slice(0, RESULT_LIMIT).map((d, i) => ({ ...d, key: String(i) })),
    total: donors.length,
    viewer: {
      city: viewer.city,
      bloodType: viewer.bloodType,
      isPublic: viewer.isPublic,
      lat: viewer.latitude,
      lng: viewer.longitude,
    },
  };
}
