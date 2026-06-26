import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { recalculatePodStrength } from "@/lib/pod-strength";

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { isAvailable } = (await request.json()) as { isAvailable?: boolean };
  if (typeof isAvailable !== "boolean") {
    return NextResponse.json({ error: "isAvailable must be a boolean" }, { status: 400 });
  }

  await prisma.user.update({ where: { id: user.id }, data: { isAvailable } });
  await recalculatePodStrength(user.id);

  return NextResponse.json({ success: true, isAvailable });
}
