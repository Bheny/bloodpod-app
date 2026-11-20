import { NextResponse } from "next/server";
import { captainApi } from "@/lib/captain/guard";
import { acceptPledge } from "@/lib/captain/promotion";

export async function POST() {
  const { user, denied } = await captainApi();
  if (denied) return denied;
  const result = await acceptPledge(user!.id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true });
}
