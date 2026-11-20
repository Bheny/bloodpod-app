import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin/auth";
import { overrideLevel } from "@/lib/captain/promotion";

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  // null clears the badge.
  level: z.number().int().min(0).max(5).nullable(),
  reason: z.string().trim().min(3).max(500),
});

export async function POST(request: Request) {
  const { user, denied } = await requireAdminApi();
  if (denied) return denied;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter an email, a level and a reason" }, { status: 400 });

  const person = await prisma.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
  if (!person) return NextResponse.json({ error: "No account with that email" }, { status: 404 });

  const result = await overrideLevel(user!.email, person.id, parsed.data.level, parsed.data.reason);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true });
}
