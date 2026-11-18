import { adb as prisma } from "@/lib/admin/db";
import { BLOOD_TYPE_LABELS } from "@/lib/blood-type";
import { nearestPlace, placeFromText } from "@/lib/admin/places";
import type { MapData, MapPlace } from "@/lib/admin/map-types";

const MAX_PEOPLE = 5000;
/** Beyond this distance from any known town, a donor is grouped on a coarse grid instead. */
const SNAP_KM = 40;
const SAMPLE_PEOPLE = 14;

/**
 * Donors are grouped by town. Individual coordinates never leave the server:
 * the map only ever receives a town centre and counts.
 */
export async function getMapData(): Promise<MapData> {
  const [totalDonors, users, hospitals] = await Promise.all([
    prisma.user.count({ where: { hospitalId: null } }),
    prisma.user.findMany({
      where: { hospitalId: null },
      orderBy: { createdAt: "desc" },
      take: MAX_PEOPLE,
      select: {
        id: true,
        name: true,
        email: true,
        bloodType: true,
        isEligible: true,
        onboardingComplete: true,
        city: true,
        latitude: true,
        longitude: true,
        _count: { select: { pushSubscriptions: true } },
      },
    }),
    prisma.hospital.findMany({ where: { status: "APPROVED" }, select: { id: true, name: true, city: true } }),
  ]);

  const places = new Map<string, MapPlace>();
  let unplaced = 0;

  const ensure = (id: string, name: string, lat: number, lng: number) => {
    let p = places.get(id);
    if (!p) {
      p = { id, name, lat, lng, donors: 0, onboarded: 0, eligible: 0, alerts: 0, blood: {}, people: [] };
      places.set(id, p);
    }
    return p;
  };

  for (const u of users) {
    let target: MapPlace | null = null;

    if (u.latitude !== null && u.longitude !== null) {
      const { place, km } = nearestPlace(u.latitude, u.longitude);
      if (km <= SNAP_KM) {
        target = ensure(place.id, place.name, place.lat, place.lng);
      } else {
        // Far from every town we know: a coarse 0.5 degree cell (about 55 km), centred, never the real spot.
        const gLat = Math.round(u.latitude * 2) / 2;
        const gLng = Math.round(u.longitude * 2) / 2;
        target = ensure(`grid:${gLat}:${gLng}`, `Near ${place.name}`, gLat, gLng);
      }
    } else {
      const place = placeFromText(u.city);
      if (place) target = ensure(place.id, place.name, place.lat, place.lng);
    }

    if (!target) {
      unplaced++;
      continue;
    }

    target.donors++;
    if (u.onboardingComplete) target.onboarded++;
    const ready = u.onboardingComplete && u.isEligible;
    if (ready) target.eligible++;
    if (u._count.pushSubscriptions > 0) target.alerts++;

    if (u.bloodType) {
      const label = BLOOD_TYPE_LABELS[u.bloodType];
      const t = (target.blood[label] ??= { total: 0, eligible: 0 });
      t.total++;
      if (ready) t.eligible++;
    }

    if (target.people.length < SAMPLE_PEOPLE) {
      target.people.push({
        id: u.id,
        name: u.name ?? u.email.split("@")[0],
        blood: u.bloodType ? BLOOD_TYPE_LABELS[u.bloodType] : null,
        eligible: ready,
      });
    }
  }

  return {
    places: [...places.values()].sort((a, b) => b.donors - a.donors),
    hospitals: hospitals.map((h) => {
      const p = placeFromText(h.city);
      return { id: h.id, name: h.name, city: h.city, lat: p?.lat ?? null, lng: p?.lng ?? null };
    }),
    unplaced,
    total: users.length,
    truncated: totalDonors > MAX_PEOPLE,
  };
}
