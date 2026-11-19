import { prisma } from "@/lib/prisma";
import { haversineDistanceKm } from "@/lib/geo";
import { placeFromText } from "@/lib/admin/places";
import { parseLabTests, type LabTest, type ServiceTestId } from "@/lib/service-tests";

export interface ServiceResult {
  id: string;
  name: string;
  town: string;
  address: string | null;
  phone: string | null;
  latitude: number;
  longitude: number;
  distanceKm: number | null;
  /** Selected tests this lab offers, with prices. */
  offered: LabTest[];
  /** Everything the lab offers, for the booking form. */
  allTests: LabTest[];
  /** Selected tests it doesn't offer. */
  missing: ServiceTestId[];
}

export interface ServicesSearch {
  results: ServiceResult[];
  /** Where distances are measured from, so the page can say so honestly. */
  origin: "exact" | "town" | null;
}

export async function searchServices(
  viewer: { latitude: number | null; longitude: number | null; city: string | null },
  selected: ServiceTestId[],
): Promise<ServicesSearch> {
  const labs = await prisma.lab.findMany({
    where: { active: true, latitude: { not: null }, longitude: { not: null } },
    take: 300,
  });

  let origin: ServicesSearch["origin"] = null;
  let from: { lat: number; lng: number } | null = null;
  if (viewer.latitude !== null && viewer.longitude !== null) {
    from = { lat: viewer.latitude, lng: viewer.longitude };
    origin = "exact";
  } else {
    const town = placeFromText(viewer.city);
    if (town) {
      from = { lat: town.lat, lng: town.lng };
      origin = "town";
    }
  }

  const results: ServiceResult[] = [];
  for (const lab of labs) {
    const tests = parseLabTests(lab.tests);
    const offered = tests.filter((t) => selected.includes(t.id));
    // With nothing selected, show every lab. Otherwise a lab must offer at least one pick.
    if (selected.length > 0 && offered.length === 0) continue;

    results.push({
      id: lab.id,
      name: lab.name,
      town: lab.town,
      address: lab.address,
      phone: lab.phone,
      latitude: lab.latitude as number,
      longitude: lab.longitude as number,
      distanceKm: from ? haversineDistanceKm(from.lat, from.lng, lab.latitude as number, lab.longitude as number) : null,
      offered: selected.length > 0 ? offered : tests,
      allTests: tests,
      missing: selected.filter((id) => !tests.some((t) => t.id === id)),
    });
  }

  // Labs that cover everything picked come first; within each group, nearest first.
  results.sort((a, b) => {
    if ((a.missing.length === 0) !== (b.missing.length === 0)) return a.missing.length === 0 ? -1 : 1;
    if (a.distanceKm !== null && b.distanceKm !== null) return a.distanceKm - b.distanceKm;
    if (a.distanceKm !== null) return -1;
    if (b.distanceKm !== null) return 1;
    return a.name.localeCompare(b.name);
  });

  return { results, origin };
}
