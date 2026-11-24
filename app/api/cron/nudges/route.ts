import { NextResponse } from "next/server";
import { sweepNudges } from "@/lib/nudges";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Runs daily at 10:00 (see vercel.json). The nudge bot: looks at everyone, works out the one thing that would
 * help them most, and sends it if the limits allow. Nothing goes out in quiet hours, and the same nudge never
 * goes out twice, so a second run does no harm.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, ...(await sweepNudges()) });
}
