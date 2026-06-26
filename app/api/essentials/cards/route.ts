import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { idCardSchema } from "@/lib/validations/essentials";
import { getUserCards } from "@/lib/essentials-data";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cards = await getUserCards(user.id);
  return NextResponse.json({ cards });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = idCardSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid data" },
      { status: 400 },
    );
  }
  const { id, expiryDate, ...rest } = parsed.data;

  const card = await prisma.idCard.create({
    data: {
      ...(id ? { id } : {}),
      userId: user.id,
      ...rest,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
    },
  });

  return NextResponse.json({ success: true, card });
}
