import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { startSpinoff } from "@/lib/readiness/spinoff";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { podId?: string; name?: string } | null;
  if (!body?.podId || !body.name) return NextResponse.json({ error: "Choose a Pod and give it a name" }, { status: 400 });

  const result = await startSpinoff({ id: user.id, name: user.name }, body.podId, body.name);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ podId: result.podId, invited: result.invited }, { status: 201 });
}
