import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isBloodType } from "@/lib/blood-type";
import { recalculatePodStrength } from "@/lib/pod-strength";

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bloodType } = (await request.json()) as { bloodType?: string };
  if (!bloodType || !isBloodType(bloodType)) {
    return NextResponse.json({ error: "Invalid blood type" }, { status: 400 });
  }

  await prisma.user.update({ where: { id: user.id }, data: { bloodType } });
  await recalculatePodStrength(user.id);

  return NextResponse.json({
    success: true,
    bloodType,
    isUniversalDonor: bloodType === "O_NEG",
    isRare: bloodType === "O_NEG" || bloodType === "AB_NEG",
  });
}
