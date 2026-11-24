import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/current-user";
import { setNudgesOff } from "@/lib/nudges";

const Body = z.object({ off: z.boolean() });

/** The switch for all nudges. Alerts about real blood requests are separate and are never affected. */
export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  await setNudgesOff(user.id, parsed.data.off);
  return NextResponse.json({ ok: true });
}
