import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/current-user";
import { answerAlert } from "@/lib/alerts";

export const dynamic = "force-dynamic";

const schema = z.object({ answer: z.enum(["COMING", "CANT"]) });

/** Someone who was alerted says whether they can come. Saying yes shares their name and number with the person who asked. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid answer" }, { status: 400 });

  const result = await answerAlert(user.id, id, parsed.data.answer);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, answer: result.answer, requesterPhone: result.requesterPhone });
}
