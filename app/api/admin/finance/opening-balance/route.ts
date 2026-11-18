import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin/auth";
import { openingBalanceSchema } from "@/lib/validations/admin";
import { OPENING_BALANCE_KEY } from "@/lib/admin/finance";

export async function PUT(request: Request) {
  const { denied } = await requireAdminApi();
  if (denied) return denied;

  const parsed = openingBalanceSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid amount" }, { status: 400 });
  }

  await prisma.appSetting.upsert({
    where: { key: OPENING_BALANCE_KEY },
    create: { key: OPENING_BALANCE_KEY, value: String(parsed.data.amount) },
    update: { value: String(parsed.data.amount) },
  });
  return NextResponse.json({ success: true });
}
