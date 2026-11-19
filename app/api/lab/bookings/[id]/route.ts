import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/current-user";
import { respondAsLab } from "@/lib/bookings";

const schema = z.object({
  action: z.enum(["accept", "propose", "decline", "complete", "cancel"]),
  scheduledFor: z.string().max(40).optional(),
  note: z.string().max(300).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  // Anyone who isn't lab staff gets the same answer as a missing booking.
  if (!user?.labId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { id } = await params;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  const { action, ...opts } = parsed.data;
  const result = await respondAsLab({ labId: user.labId }, id, action, opts);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true });
}
