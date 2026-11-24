import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createReport } from "@/lib/reports";

/** Tell us about someone you met through BloodPod. The reported person is never told who. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const res = await createReport(user.id, body ?? {});
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: res.status });
  return NextResponse.json({ ok: true });
}
