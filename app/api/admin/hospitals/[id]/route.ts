import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin/auth";
import { hospitalReviewSchema } from "@/lib/validations/admin";
import { emailHospitalDecision } from "@/lib/email/notify";

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

    if (status === "APPROVED" || status === "REJECTED") {
      const staff = await prisma.user.findMany({ where: { hospitalId: id }, select: { email: true, name: true } });
      for (const person of staff) {
        emailHospitalDecision({
          to: person.email,
          hospitalId: id,
          name: person.name,
          hospitalName: hospital.name,
          status,
          note: note || null,
          stamp: String(hospital.reviewedAt?.getTime() ?? Date.now()),
        });
      }
    }
    return NextResponse.json({ hospital });
  } catch {
    return NextResponse.json({ error: "Hospital not found" }, { status: 404 });
  }
}
