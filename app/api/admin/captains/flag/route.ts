import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin/auth";
import { CAPTAIN } from "@/lib/captain-config";

const schema = z.object({ enabled: z.boolean() });

/** The switch for the whole programme. Admin only. */
export async function POST(request: Request) {
  const { denied } = await requireAdminApi();
  if (denied) return denied;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const value = parsed.data.enabled ? "true" : "false";
  await prisma.appSetting.upsert({ where: { key: CAPTAIN.flagKey }, create: { key: CAPTAIN.flagKey, value }, update: { value } });
  return NextResponse.json({ ok: true, enabled: parsed.data.enabled });
}
