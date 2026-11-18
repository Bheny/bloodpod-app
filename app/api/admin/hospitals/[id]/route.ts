import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin/auth";
import { hospitalReviewSchema } from "@/lib/validations/admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, denied } = await requireAdminApi();
  if (denied) return denied;
  const { id } = await params;

  const parsed = hospitalReviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid review" }, { status: 400 });
  const { status, note } = parsed.data;

  if (status === "REJECTED" && !note) {
    return NextResponse.json({ error: "Add a short reason so you remember why" }, { status: 400 });
  }

  try {
    const hospital = await prisma.hospital.update({
      where: { id },
      data:
        status === "PENDING"
          ? { status, reviewedAt: null, reviewedBy: null, reviewNote: null }
          : { status, reviewedAt: new Date(), reviewedBy: user!.email, reviewNote: note || null },
    });
    return NextResponse.json({ hospital });
  } catch {
    return NextResponse.json({ error: "Hospital not found" }, { status: 404 });
  }
}
