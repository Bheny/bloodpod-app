import { NextResponse } from "next/server";
import { captainApi } from "@/lib/captain/guard";
import { startDrill } from "@/lib/captain/drill";

export async function POST(request: Request) {
  const { user, denied } = await captainApi();
  if (denied) return denied;

  const body = (await request.json().catch(() => null)) as { podId?: string } | null;
  if (!body?.podId) return NextResponse.json({ error: "Choose a Pod" }, { status: 400 });

  const result = await startDrill(user!.id, body.podId);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ id: result.id, sent: result.sent, eligible: result.eligible }, { status: 201 });
}
