import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { idCardSchema } from "@/lib/validations/essentials";
import { getUserCard } from "@/lib/essentials-data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ cardId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { cardId } = await params;
  const card = await getUserCard(user.id, cardId);
  if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ card });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ cardId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { cardId } = await params;
  const existing = await getUserCard(user.id, cardId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = idCardSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid data" },
      { status: 400 },
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- id is client-supplied only on create, never updatable
  const { id, expiryDate, ...rest } = parsed.data;

  const card = await prisma.idCard.update({
    where: { id: cardId },
    data: { ...rest, expiryDate: expiryDate ? new Date(expiryDate) : null },
  });

  return NextResponse.json({ success: true, card });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ cardId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { cardId } = await params;
  const existing = await getUserCard(user.id, cardId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.idCard.delete({ where: { id: cardId } });
  return NextResponse.json({ success: true });
}
