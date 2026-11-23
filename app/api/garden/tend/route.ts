import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { recordTended } from "@/lib/garden-data";

/** "I'm still here and my details are right": the one-tap weekly check-in. Counts the week once. */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await recordTended(user.id, "CHECK_IN");
  return NextResponse.json({ ok: true });
}
