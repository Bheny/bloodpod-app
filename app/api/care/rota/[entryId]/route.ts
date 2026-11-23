import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { answerAsk } from "@/lib/care";
import { answerSchema } from "@/lib/validations/care";

/** A donor says Yes or No. Never gated by plan: answering is free for everyone. */
export async function POST(request: Request, { params }: { params: Promise<{ entryId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = answerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Answer yes or no" }, { status: 400 });

  const { entryId } = await params;
  const result = await answerAsk(user.id, entryId, parsed.data.answer);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ status: result.status });
}
