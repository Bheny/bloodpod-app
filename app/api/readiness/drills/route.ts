import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { startDrill } from "@/lib/readiness/drill";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { podId?: string } | null;
  if (!body?.podId) return NextResponse.json({ error: "Choose a Pod" }, { status: 400 });

  const result = await startDrill(user.id, body.podId);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ id: result.id, sent: result.sent, eligible: result.eligible }, { status: 201 });
}
