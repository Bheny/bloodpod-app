import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { respondToDrill } from "@/lib/readiness/drill";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const result = await respondToDrill(user.id, id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, secondsToRespond: result.secondsToRespond });
}
