import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { appUrl } from "@/lib/email/send";
import { emailAdmins, emailPlanInterest } from "@/lib/email/notify";
import { PLAN_NAMES } from "@/lib/plan-catalog";

const schema = z.object({ plan: z.enum(["BASIC", "PLUS", "CARE"]).default("CARE") });

/** Records that this person wants a plan once payments open. Safe to call twice. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Choose a plan" }, { status: 400 });
  const { plan } = parsed.data;
  const planName = PLAN_NAMES[plan];

  const where = { userId_plan: { userId: user.id, plan } };
  const before = await prisma.planInterest.findUnique({ where, select: { id: true } });
  await prisma.planInterest.upsert({ where, create: { userId: user.id, plan }, update: {} });

  // Only the first tap sends anything, so pressing the button twice stays quiet.
  if (!before) {
    if (user.email) emailPlanInterest({ to: user.email, userId: user.id, name: user.name, planName });
    emailAdmins({
      key: `plan-interest/${user.id}/${plan}`,
      subject: `Someone wants ${planName}`,
      lines: [`${user.name ?? user.email} asked to be told when ${planName} opens.`],
      cta: { label: "Open admin", url: appUrl("/admin") },
    });
  }
  return NextResponse.json({ ok: true });
}
