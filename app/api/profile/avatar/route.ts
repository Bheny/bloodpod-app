import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { avatarUrl } = (await request.json()) as { avatarUrl?: string };
  if (!avatarUrl) {
    return NextResponse.json({ error: "avatarUrl is required" }, { status: 400 });
  }

  await prisma.user.update({ where: { id: user.id }, data: { avatarUrl } });
  return NextResponse.json({ success: true, avatarUrl });
}
