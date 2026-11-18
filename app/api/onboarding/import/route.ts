import { NextResponse } from "next/server";
import { z } from "zod";
import type { BloodType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isBloodType } from "@/lib/blood-type";
import { computeEligibility } from "@/lib/eligibility";
import { recalculatePodStrength } from "@/lib/pod-strength";

const schema = z.object({
  bloodType: z.string().refine(isBloodType, "Invalid blood type"),
  neverDonated: z.boolean(),
  lastDonated: z.string().nullable().optional(),
  city: z.string().trim().min(2).max(60),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

// Saves the answers a visitor gave on /start once they have an account.
export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid answers" }, { status: 400 });
  const v = parsed.data;

  let donated: Date | null = null;
  if (!v.neverDonated) {
    donated = v.lastDonated ? new Date(v.lastDonated) : null;
    if (!donated || Number.isNaN(donated.getTime()) || donated.getTime() > Date.now()) {
      return NextResponse.json({ error: "Invalid last donation date" }, { status: 400 });
    }
  }

  const { nextEligible, isEligible } = computeEligibility(donated);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      bloodType: v.bloodType as BloodType,
      lastDonated: donated,
      nextEligible,
      isEligible,
      donationInfoAt: new Date(),
      city: v.city,
      latitude: v.latitude,
      longitude: v.longitude,
    },
  });
  await recalculatePodStrength(user.id);

  return NextResponse.json({ success: true });
}
