import { NextResponse } from "next/server";
import { expireAlerts, widenDueAlerts } from "@/lib/alerts";

export const dynamic = "force-dynamic";

/**
 * Runs daily (see vercel.json) as a backstop. Requests are normally widened the moment anyone loads their
 * alerts, so this only catches a request nobody opened. It also marks requests whose time ran out as expired.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const widened = await widenDueAlerts(50);
  const expired = await expireAlerts();
  return NextResponse.json({ ok: true, widened, expired });
}
