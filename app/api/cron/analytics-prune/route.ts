import { NextResponse } from "next/server";
import { prunePageViews } from "@/lib/admin/analytics";
import { RETENTION_DAYS } from "@/lib/analytics";

export const dynamic = "force-dynamic";

/** Runs weekly (see vercel.json): page views older than the retention window are deleted, as the privacy policy says. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const deleted = await prunePageViews(RETENTION_DAYS);
  return NextResponse.json({ ok: true, deleted });
}
