import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";

// Records that the donor agreed to be contacted for emergencies in their area.
export async function PUT() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.user.update({
    where: { id: user.id },
    data: { emergencyConsentAt: new Date(), isAvailable: true },
  });

  return NextResponse.json({ success: true });
}
