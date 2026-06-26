const GHANA_CITIES = [
  { name: "Accra", lat: 5.6037, lng: -0.187 },
  { name: "Kumasi", lat: 6.6885, lng: -1.6244 },
  { name: "Tamale", lat: 9.4035, lng: -0.8393 },
  { name: "Takoradi", lat: 4.8845, lng: -1.7554 },
  { name: "Cape Coast", lat: 5.1053, lng: -1.2466 },
  { name: "Tema", lat: 5.6698, lng: -0.0166 },
  { name: "Sunyani", lat: 7.3399, lng: -2.3267 },
  { name: "Ho", lat: 6.6, lng: 0.4713 },
];

export function nearestCity(lat: number, lng: number): string {
  let best = GHANA_CITIES[0];
  let bestDist = Infinity;

  for (const city of GHANA_CITIES) {
    const dist = (city.lat - lat) ** 2 + (city.lng - lng) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      best = city;
    }
  }

  return best.name;
}
