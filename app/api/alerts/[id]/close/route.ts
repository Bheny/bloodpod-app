import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/current-user";
import { closeAlert } from "@/lib/alerts";

export const dynamic = "force-dynamic";

const schema = z.object({ outcome: z.enum(["FULFILLED", "CANCELLED"]) });

/** The person who asked says the blood is covered, or takes the request back. Everyone alerted is told. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid outcome" }, { status: 400 });

  const result = await closeAlert(user.id, id, parsed.data.outcome);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true });
}
