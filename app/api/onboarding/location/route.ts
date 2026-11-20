import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { recalculatePodStrength } from "@/lib/pod-strength";
import { canonicalCity } from "@/lib/nearest-city";

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { city: rawCity, latitude, longitude } = (await request.json()) as {
    city?: string;
    latitude?: number;
    longitude?: number;
  };

  if (!rawCity?.trim()) {
    return NextResponse.json({ error: "City is required" }, { status: 400 });
  }
  const city = canonicalCity(rawCity);

  await prisma.user.update({
    where: { id: user.id },
    data: { city, latitude, longitude },
  });
  await recalculatePodStrength(user.id);

  const nearbyDonors = await prisma.user.count({
    where: { city: { equals: city, mode: "insensitive" }, id: { not: user.id } },
  });

  return NextResponse.json({ success: true, nearbyDonors, nearbyHospitals: 3 });
}
