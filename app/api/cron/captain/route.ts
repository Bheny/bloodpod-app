import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CAPTAIN } from "@/lib/captain-config";
import { isCaptainEnabled } from "@/lib/captain/flag";
import { finishDrill } from "@/lib/captain/finish";
import { recomputeForUser } from "@/lib/captain/status";

export const dynamic = "force-dynamic";

/**
 * Nightly. Closes drills nobody looked at, then brings every leader's Captain status up to date
 * (promotions, the 30-day warning, the lapse). With the programme off it does nothing at all.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isCaptainEnabled())) return NextResponse.json({ skipped: "captain_programme is off" });

  // 1. Drills whose window ended without anyone opening the result.
  const overdue = await prisma.drill.findMany({
    where: { closedAt: null, startedAt: { lt: new Date(Date.now() - CAPTAIN.drillWindowMinutes * 60_000) } },
    select: { id: true },
    take: 200,
  });
  for (const d of overdue) await finishDrill(d.id).catch((err) => console.error("[captain] close failed", err));

  // 2. Everyone who has passed a drill, or already has a status.
  const [drilled, tracked] = await Promise.all([
    prisma.drill.findMany({ where: { passed: true }, select: { pod: { select: { ownerId: true } } }, distinct: ["podId"], take: 1000 }),
    prisma.captainStatus.findMany({ select: { userId: true }, take: 1000 }),
  ]);
  const leaders = new Set([...drilled.map((d) => d.pod.ownerId), ...tracked.map((t) => t.userId)]);

  let done = 0;
  for (const id of leaders) {
    try {
      await recomputeForUser(id);
      done++;
    } catch (err) {
      console.error("[captain] nightly recompute failed", id, err);
    }
  }
  return NextResponse.json({ closedDrills: overdue.length, recomputed: done });
}
