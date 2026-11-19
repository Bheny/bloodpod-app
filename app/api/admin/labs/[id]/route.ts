import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin/auth";
import { labActiveSchema, labSchema } from "@/lib/validations/admin";
import { placeFromText } from "@/lib/admin/places";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { denied } = await requireAdminApi();
  if (denied) return denied;
  const { id } = await params;
  const body = await request.json().catch(() => null);

  // Quick show/hide switch.
  const toggle = labActiveSchema.safeParse(body);
  if (toggle.success) {
    try {
      const lab = await prisma.lab.update({ where: { id }, data: { active: toggle.data.active } });
      return NextResponse.json({ lab });
    } catch {
      return NextResponse.json({ error: "Lab not found" }, { status: 404 });
    }
  }

  const parsed = labSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid lab" }, { status: 400 });
  }
  const d = parsed.data;
  const town = placeFromText(d.town);
  const latitude = d.latitude ?? town?.lat ?? null;
  const longitude = d.longitude ?? town?.lng ?? null;
  if (latitude === null || longitude === null) {
    return NextResponse.json({ error: "Pick a known town, or enter the map coordinates" }, { status: 400 });
  }

  try {
    const lab = await prisma.lab.update({
      where: { id },
      data: {
        name: d.name,
        town: d.town,
        address: d.address,
        phone: d.phone,
        latitude,
        longitude,
        tests: d.tests.map((t) => ({ id: t.id, pricePesewas: t.price })),
      },
    });
    return NextResponse.json({ lab });
  } catch {
    return NextResponse.json({ error: "Lab not found" }, { status: 404 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { denied } = await requireAdminApi();
  if (denied) return denied;
  const { id } = await params;

  // Labs with bookings are hidden, not deleted, so booking history keeps its lab.
  const bookings = await prisma.booking.count({ where: { labId: id } });
  if (bookings > 0) {
    await prisma.lab.update({ where: { id }, data: { active: false } }).catch(() => null);
    return NextResponse.json({ hidden: true });
  }
  await prisma.lab.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ deleted: true });
}
