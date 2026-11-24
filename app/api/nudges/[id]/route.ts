import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/current-user";
import { answerNudge } from "@/lib/nudges";

const Body = z.object({ action: z.enum(["acted", "dismissed"]) });

/** "Not now": they closed a nudge. It stays away for a while. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { id } = await params;
  await answerNudge(user.id, id, parsed.data.action);
  return NextResponse.json({ ok: true });
}
