import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin/auth";
import { decidePromotion } from "@/lib/captain/promotion";

const schema = z.object({ decision: z.enum(["APPROVED", "REJECTED"]), reason: z.string().max(500).optional() });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, denied } = await requireAdminApi();
  if (denied) return denied;
  const { id } = await params;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid decision" }, { status: 400 });

  const result = await decidePromotion(id, parsed.data.decision, user!.email, parsed.data.reason ?? null);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true });
}
