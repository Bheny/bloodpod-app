import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createAlert } from "@/lib/alerts";

export const dynamic = "force-dynamic";

/** Raise a blood request. It goes to the requester's Pod at once, and widens to donors nearby if nobody answers. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const result = await createAlert(user, body, { test: body.test === true });
  if (!result.ok) return NextResponse.json({ error: result.error, id: result.id }, { status: result.status });
  return NextResponse.json({ ok: true, id: result.id, alerted: result.alerted, widenedNow: result.widenedNow });
}
