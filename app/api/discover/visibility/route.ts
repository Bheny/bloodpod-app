import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { isPublic } = (await request.json()) as { isPublic?: boolean };
  if (typeof isPublic !== "boolean") {
    return NextResponse.json({ error: "isPublic must be a boolean" }, { status: 400 });
  }

  await prisma.user.update({ where: { id: user.id }, data: { isPublic } });
  return NextResponse.json({ success: true, isPublic });
}
