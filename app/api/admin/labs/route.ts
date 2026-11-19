import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin/auth";
import { labSchema } from "@/lib/validations/admin";
import { placeFromText } from "@/lib/admin/places";

export async function POST(request: Request) {
  const { denied } = await requireAdminApi();
  if (denied) return denied;

  const parsed = labSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid lab" }, { status: 400 });
  }
  const d = parsed.data;

  // A pin is required for the Services page to sort by distance.
  const town = placeFromText(d.town);
  const latitude = d.latitude ?? town?.lat ?? null;
  const longitude = d.longitude ?? town?.lng ?? null;
  if (latitude === null || longitude === null) {
    return NextResponse.json({ error: "Pick a known town, or enter the map coordinates" }, { status: 400 });
  }

  const lab = await prisma.lab.create({
    data: {
      name: d.name,
      town: d.town,
      address: d.address,
      phone: d.phone,
      latitude,
      longitude,
      active: d.active ?? true,
      tests: d.tests.map((t) => ({ id: t.id, pricePesewas: t.price })),
    },
  });
  return NextResponse.json({ lab }, { status: 201 });
}
