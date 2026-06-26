import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { documentSchema } from "@/lib/validations/essentials";
import { getUserDocument } from "@/lib/essentials-data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { documentId } = await params;
  const document = await getUserDocument(user.id, documentId);
  if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ document });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { documentId } = await params;
  const existing = await getUserDocument(user.id, documentId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = documentSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid data" },
      { status: 400 },
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- id is client-supplied only on create, never updatable
  const { id, documentDate, ...rest } = parsed.data;

  const document = await prisma.document.update({
    where: { id: documentId },
    data: { ...rest, documentDate: documentDate ? new Date(documentDate) : null },
  });

  return NextResponse.json({ success: true, document });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { documentId } = await params;
  const existing = await getUserDocument(user.id, documentId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.document.delete({ where: { id: documentId } });
  return NextResponse.json({ success: true });
}
