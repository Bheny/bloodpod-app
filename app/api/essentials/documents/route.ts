import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { documentSchema } from "@/lib/validations/essentials";
import { getUserDocuments } from "@/lib/essentials-data";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const documents = await getUserDocuments(user.id);
  return NextResponse.json({ documents });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = documentSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid data" },
      { status: 400 },
    );
  }
  const { id, documentDate, ...rest } = parsed.data;

  const document = await prisma.document.create({
    data: {
      ...(id ? { id } : {}),
      userId: user.id,
      ...rest,
      documentDate: documentDate ? new Date(documentDate) : undefined,
    },
  });

  return NextResponse.json({ success: true, document });
}
