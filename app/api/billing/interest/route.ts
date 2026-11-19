import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";

/** Records that this person wants the Care plan once payments open. Safe to call twice. */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.planInterest.upsert({
    where: { userId_plan: { userId: user.id, plan: "CARE" } },
    create: { userId: user.id, plan: "CARE" },
    update: {},
  });
  return NextResponse.json({ ok: true });
}
