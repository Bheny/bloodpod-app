import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin/auth";
import { emailLabStaffAdded } from "@/lib/email/notify";

const addSchema = z.object({ email: z.string().trim().toLowerCase().email() });
const removeSchema = z.object({ userId: z.string().min(1) });

/** Gives an existing account access to this lab's inbox. They must have signed up first. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { denied } = await requireAdminApi();
  if (denied) return denied;
  const { id } = await params;

  const parsed = addSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });

  const person = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!person) return NextResponse.json({ error: "No account with that email. Ask them to sign up first." }, { status: 404 });
  if (person.hospitalId) return NextResponse.json({ error: "That account belongs to a hospital" }, { status: 409 });
  if (person.labId && person.labId !== id) return NextResponse.json({ error: "That account already belongs to another lab" }, { status: 409 });

  await prisma.user.update({ where: { id: person.id }, data: { labId: id } });
  const lab = await prisma.lab.findUnique({ where: { id }, select: { name: true } });
  if (lab && person.labId !== id) emailLabStaffAdded({ to: person.email, userId: person.id, name: person.name, labName: lab.name });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { denied } = await requireAdminApi();
  if (denied) return denied;
  const { id } = await params;

  const parsed = removeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  await prisma.user.updateMany({ where: { id: parsed.data.userId, labId: id }, data: { labId: null } });
  return NextResponse.json({ ok: true });
}
