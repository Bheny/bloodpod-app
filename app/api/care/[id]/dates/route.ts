import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { addTransfusionDate } from "@/lib/care";
import { addDateSchema } from "@/lib/validations/care";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = addDateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Pick a valid date" }, { status: 400 });

  const { id } = await params;
  const result = await addTransfusionDate(user.id, id, new Date(parsed.data.scheduledFor), parsed.data.donorsNeeded);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ id: result.id }, { status: 201 });
}
