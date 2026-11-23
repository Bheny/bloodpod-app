import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { completeTransfusion } from "@/lib/care";

/** Marks a transfusion as done. With an interval set, the next date is booked automatically. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string; dateId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, dateId } = await params;
  const result = await completeTransfusion(user.id, id, dateId);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true });
}
