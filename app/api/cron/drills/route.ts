import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { READINESS } from "@/lib/readiness-config";
import { closeDrillIfOver } from "@/lib/readiness/drill";

export const dynamic = "force-dynamic";

/**
 * Daily. Closes drills whose window ended without anyone opening the result, so every drill
 * ends up with a pass or not-yet answer.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const overdue = await prisma.drill.findMany({
    where: { closedAt: null, startedAt: { lt: new Date(Date.now() - READINESS.drillWindowMinutes * 60_000) } },
    select: { id: true },
    take: 200,
  });
  for (const d of overdue) await closeDrillIfOver(d.id).catch((err) => console.error("[drills] close failed", err));

  return NextResponse.json({ closedDrills: overdue.length });
}
