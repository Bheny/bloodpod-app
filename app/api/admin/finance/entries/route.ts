import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin/auth";
import { ledgerEntrySchema } from "@/lib/validations/admin";

export async function POST(request: Request) {
  const { denied } = await requireAdminApi();
  if (denied) return denied;

  const parsed = ledgerEntrySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid entry" }, { status: 400 });
  }
  const v = parsed.data;

  if (v.hospitalId) {
    const exists = await prisma.hospital.findUnique({ where: { id: v.hospitalId }, select: { id: true } });
    if (!exists) return NextResponse.json({ error: "Hospital not found" }, { status: 400 });
  }

  const entry = await prisma.ledgerEntry.create({
    data: {
      type: v.type,
      status: v.status,
      category: v.category,
      description: v.description || null,
      amountPesewas: v.amount,
      date: new Date(v.date),
      invoiceNo: v.invoiceNo || null,
      hospitalId: v.hospitalId || null,
    },
  });
  return NextResponse.json({ entry });
}
