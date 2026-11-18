import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin/auth";
import { contractPatchSchema } from "@/lib/validations/admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { denied } = await requireAdminApi();
  if (denied) return denied;
  const { id } = await params;

  const parsed = contractPatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  try {
    const contract = await prisma.contract.update({
      where: { id },
      data: { status: parsed.data.status, endsAt: parsed.data.status === "ENDED" ? new Date() : null },
    });
    return NextResponse.json({ contract });
  } catch {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }
}
