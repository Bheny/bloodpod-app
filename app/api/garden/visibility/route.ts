import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

/** "Keep me off the Garden leaders posters" on or off. It only ever changes the caller's own choice. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { hidden?: unknown } | null;
  if (typeof body?.hidden !== "boolean") return NextResponse.json({ error: "Choose on or off" }, { status: 400 });

  await prisma.user.update({ where: { id: user.id }, data: { gardenHidden: body.hidden } });
  return NextResponse.json({ hidden: body.hidden });
}
