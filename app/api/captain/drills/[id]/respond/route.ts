import { NextResponse } from "next/server";
import { captainApi } from "@/lib/captain/guard";
import { respondToDrill } from "@/lib/captain/drill";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, denied } = await captainApi();
  if (denied) return denied;
  const { id } = await params;

  const result = await respondToDrill(user!.id, id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, secondsToRespond: result.secondsToRespond });
}
