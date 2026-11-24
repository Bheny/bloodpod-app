import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin/auth";
import { logOutreach } from "@/lib/reports";
import { TEMPLATE_IDS } from "@/lib/whatsapp";

const Body = z.object({ userId: z.string().min(1), template: z.string().refine((t) => t === "custom" || TEMPLATE_IDS.includes(t)) });

/** Notes that an admin opened a WhatsApp chat with someone, so the next admin can see it. */
export async function POST(request: Request) {
  const { user, denied } = await requireAdminApi();
  if (denied) return denied;
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  await logOutreach(user.email, parsed.data.userId, parsed.data.template);
  return NextResponse.json({ ok: true });
}
