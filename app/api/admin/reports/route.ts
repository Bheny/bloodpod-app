import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin/auth";
import { reviewReports } from "@/lib/reports";

const Body = z.object({
  userId: z.string().min(1),
  action: z.enum(["dismiss", "action", "hold", "release"]),
  note: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  const { user, denied } = await requireAdminApi();
  if (denied) return denied;
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  await reviewReports(user.email, parsed.data.userId, parsed.data.action, parsed.data.note ?? null);
  return NextResponse.json({ ok: true });
}
