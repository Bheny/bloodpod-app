import { NextResponse } from "next/server";
import { captainApi } from "@/lib/captain/guard";
import { startSpinoff } from "@/lib/captain/spinoff";

export async function POST(request: Request) {
  const { user, denied } = await captainApi();
  if (denied) return denied;

  const body = (await request.json().catch(() => null)) as { podId?: string; name?: string } | null;
  if (!body?.podId || !body.name) return NextResponse.json({ error: "Choose a Pod and give it a name" }, { status: 400 });

  const result = await startSpinoff({ id: user!.id, name: user!.name }, body.podId, body.name);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ podId: result.podId, invited: result.invited }, { status: 201 });
}
