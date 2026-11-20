import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { appUrl } from "@/lib/email/send";
import { emailAdmins, emailPlanInterest } from "@/lib/email/notify";

/** Records that this person wants the Care plan once payments open. Safe to call twice. */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const before = await prisma.planInterest.findUnique({ where: { userId_plan: { userId: user.id, plan: "CARE" } }, select: { id: true } });
  await prisma.planInterest.upsert({
    where: { userId_plan: { userId: user.id, plan: "CARE" } },
    create: { userId: user.id, plan: "CARE" },
    update: {},
  });

  // Only the first tap sends anything, so pressing the button twice stays quiet.
  if (!before) {
    if (user.email) emailPlanInterest({ to: user.email, userId: user.id, name: user.name, planName: "the Care plan" });
    emailAdmins({
      key: `plan-interest/${user.id}`,
      subject: "Someone wants the Care plan",
      lines: [`${user.name ?? user.email} asked to be told when the Care plan opens.`],
      cta: { label: "Open admin", url: appUrl("/admin") },
    });
  }
  return NextResponse.json({ ok: true });
}
