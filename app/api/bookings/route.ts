import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createBooking } from "@/lib/bookings";

const schema = z.object({
  labId: z.string().min(1),
  testIds: z.array(z.string()).min(1).max(8),
  preferredDate: z.string().min(8).max(40),
  note: z.string().max(300).optional(),
  consent: z.boolean(),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the form and try again" }, { status: 400 });

  const result = await createBooking({ id: user.id, name: user.name }, parsed.data);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ id: result.id }, { status: 201 });
}
