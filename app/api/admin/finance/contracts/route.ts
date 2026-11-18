import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin/auth";
import { contractSchema } from "@/lib/validations/admin";

export async function POST(request: Request) {
  const { denied } = await requireAdminApi();
  if (denied) return denied;

  const parsed = contractSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid contract" }, { status: 400 });
  }
  const v = parsed.data;

  const hospital = await prisma.hospital.findUnique({ where: { id: v.hospitalId }, select: { status: true } });
  if (!hospital) return NextResponse.json({ error: "Hospital not found" }, { status: 400 });
  if (hospital.status !== "APPROVED") {
    return NextResponse.json({ error: "Approve the hospital before adding a contract" }, { status: 400 });
  }

  const contract = await prisma.contract.create({
    data: { hospitalId: v.hospitalId, monthlyPesewas: v.monthly, startsAt: new Date(v.startsAt), notes: v.notes || null },
  });
  return NextResponse.json({ contract });
}
