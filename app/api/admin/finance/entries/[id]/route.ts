import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin/auth";
import { ledgerPatchSchema } from "@/lib/validations/admin";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const { denied } = await requireAdminApi();
  if (denied) return denied;
  const { id } = await params;

  const parsed = ledgerPatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  try {
    const entry = await prisma.ledgerEntry.update({ where: { id }, data: { status: parsed.data.status } });
    return NextResponse.json({ entry });
  } catch {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { denied } = await requireAdminApi();
  if (denied) return denied;
  const { id } = await params;

  try {
    await prisma.ledgerEntry.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }
}
