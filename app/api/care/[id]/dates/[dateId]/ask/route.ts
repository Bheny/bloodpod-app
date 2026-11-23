import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { askDonors } from "@/lib/care";
import { askSchema } from "@/lib/validations/care";

/** Ask eligible Pod members to give on one date. Each donor is asked once per date. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string; dateId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = askSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose who to ask" }, { status: 400 });

  const { id, dateId } = await params;
  const result = await askDonors(user.id, id, dateId, parsed.data.donorIds);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ asked: result.asked }, { status: 201 });
}
