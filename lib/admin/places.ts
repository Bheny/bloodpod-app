import { haversineDistanceKm } from "@/lib/geo";

// Town centres, approximate to a few kilometres. Used to place donors on the admin map
// without ever drawing an individual's exact location. Safe to import from client code.
export type PlaceDef = { id: string; name: string; lat: number; lng: number };

export const PLACES: PlaceDef[] = [
  { id: "accra", name: "Accra", lat: 5.6037, lng: -0.187 },
  { id: "tema", name: "Tema", lat: 5.6698, lng: -0.0166 },
  { id: "madina", name: "Madina", lat: 5.6684, lng: -0.165 },
  { id: "adenta", name: "Adenta", lat: 5.7167, lng: -0.1667 },
  { id: "legon", name: "Legon", lat: 5.6502, lng: -0.187 },
  { id: "teshie", name: "Teshie", lat: 5.58, lng: -0.105 },
  { id: "nungua", name: "Nungua", lat: 5.6, lng: -0.075 },
  { id: "ashaiman", name: "Ashaiman", lat: 5.694, lng: -0.033 },
  { id: "dodowa", name: "Dodowa", lat: 5.8833, lng: -0.0967 },
  { id: "kasoa", name: "Kasoa", lat: 5.534, lng: -0.417 },
  { id: "winneba", name: "Winneba", lat: 5.351, lng: -0.623 },
  { id: "saltpond", name: "Saltpond", lat: 5.208, lng: -1.061 },
  { id: "cape-coast", name: "Cape Coast", lat: 5.1053, lng: -1.2466 },
  { id: "elmina", name: "Elmina", lat: 5.0847, lng: -1.349 },
  { id: "sekondi", name: "Sekondi", lat: 4.934, lng: -1.7137 },
  { id: "takoradi", name: "Takoradi", lat: 4.8845, lng: -1.7554 },
  { id: "tarkwa", name: "Tarkwa", lat: 5.3018, lng: -1.9959 },
  { id: "axim", name: "Axim", lat: 4.8667, lng: -2.2407 },
  { id: "koforidua", name: "Koforidua", lat: 6.0941, lng: -0.2591 },
  { id: "akim-oda", name: "Akim Oda", lat: 5.927, lng: -0.987 },
  { id: "nkawkaw", name: "Nkawkaw", lat: 6.55, lng: -0.7667 },
  { id: "kumasi", name: "Kumasi", lat: 6.6885, lng: -1.6244 },
  { id: "obuasi", name: "Obuasi", lat: 6.2027, lng: -1.6638 },
  { id: "techiman", name: "Techiman", lat: 7.5833, lng: -1.9333 },
  { id: "sunyani", name: "Sunyani", lat: 7.3399, lng: -2.3267 },
  { id: "berekum", name: "Berekum", lat: 7.45, lng: -2.5833 },
  { id: "goaso", name: "Goaso", lat: 6.8, lng: -2.5167 },
  { id: "kintampo", name: "Kintampo", lat: 8.0583, lng: -1.7333 },
  { id: "ho", name: "Ho", lat: 6.6008, lng: 0.4713 },
  { id: "hohoe", name: "Hohoe", lat: 7.15, lng: 0.47 },
  { id: "aflao", name: "Aflao", lat: 6.117, lng: 1.197 },
  { id: "tamale", name: "Tamale", lat: 9.4035, lng: -0.8393 },
  { id: "yendi", name: "Yendi", lat: 9.4333, lng: -0.0167 },
  { id: "damongo", name: "Damongo", lat: 9.0833, lng: -1.8167 },
  { id: "bolgatanga", name: "Bolgatanga", lat: 10.7856, lng: -0.8514 },
  { id: "navrongo", name: "Navrongo", lat: 10.896, lng: -1.092 },
  { id: "bawku", name: "Bawku", lat: 11.06, lng: -0.24 },
  { id: "wa", name: "Wa", lat: 10.0601, lng: -2.5099 },
];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();

/** Finds a known town named in free text such as "Accra, Ghana" or "East Legon, Accra". Longest name wins. */
export function placeFromText(text: string | null | undefined): PlaceDef | null {
  if (!text) return null;
  const t = ` ${norm(text)} `;
  let best: PlaceDef | null = null;
  for (const p of PLACES) {
    if (t.includes(` ${norm(p.name)} `) && (!best || p.name.length > best.name.length)) best = p;
  }
  return best;
}

export function nearestPlace(lat: number, lng: number): { place: PlaceDef; km: number } {
  let best = PLACES[0];
  let bestKm = Infinity;
  for (const p of PLACES) {
    const km = haversineDistanceKm(lat, lng, p.lat, p.lng);
    if (km < bestKm) {
      bestKm = km;
      best = p;
    }
  }
  return { place: best, km: bestKm };
}
