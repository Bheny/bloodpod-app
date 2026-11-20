import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRequest } from "@/lib/donor-requests";
import { REQUEST_RULES } from "@/lib/donor-requests-rules";

const schema = z.object({
  donorId: z.string().min(1).max(64),
  message: z.string().max(REQUEST_RULES.messageMax).optional(),
});

/** Ask one donor for help. They see a first name and your message; nothing else is shared until they say yes. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a donor" }, { status: 400 });

  const result = await createRequest(
    { id: user.id, name: user.name, hospitalId: user.hospitalId, labId: user.labId },
    parsed.data.donorId,
    parsed.data.message ?? null,
  );
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ id: result.id }, { status: 201 });
}
