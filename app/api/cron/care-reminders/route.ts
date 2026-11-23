import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";
import { entitlementSubject } from "@/lib/care";
import { can } from "@/lib/entitlements";
import { canNotify, donorReminderDue, familyReminderDue } from "@/lib/care-rules";

export const dynamic = "force-dynamic";

const DAY = 86_400_000;
const fmt = (d: Date) => d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

/**
 * Runs once a day (see vercel.json). Donors who said Yes are reminded 3 days and 1 day before a
 * transfusion; the family is warned 7 days before if the rota is short. Only families on a plan
 * with reminders get them, but the donors' own answers and the alerts they receive never depend on a plan.
 *
 * Every send is stamped on the row first, so a retry the same day does not notify anyone twice.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const since = new Date(now.getTime() - DAY);
  let donorReminders = 0;
  let familyReminders = 0;

  const dates = await prisma.transfusionDate.findMany({
    where: { completedAt: null, scheduledFor: { gte: new Date(now.getTime() - DAY), lte: new Date(now.getTime() + 8 * DAY) } },
    include: {
      careProfile: { select: { id: true, ownerId: true, displayName: true } },
      rota: { select: { id: true, donorId: true, status: true, remind3dSentAt: true, remind1dSentAt: true } },
    },
    take: 500,
  });

  const planCache = new Map<string, boolean>();
  const planAllows = async (ownerId: string) => {
    if (!planCache.has(ownerId)) planCache.set(ownerId, can(await entitlementSubject(ownerId), "donor_reminders", now));
    return planCache.get(ownerId)!;
  };

  for (const d of dates) {
    if (!(await planAllows(d.careProfile.ownerId))) continue;
    const yes = d.rota.filter((r) => r.status === "YES");

    // Donors who said Yes.
    for (const r of yes) {
      const due = donorReminderDue(now, d.scheduledFor, r);
      if (!due) continue;
      const recent = await prisma.notificationLog.count({ where: { userId: r.donorId, critical: false, createdAt: { gt: since } } });
      // Over the daily limit: leave the stamp empty so tomorrow's run tries again.
      if (!canNotify(recent)) continue;
      await prisma.rotaEntry.update({
        where: { id: r.id },
        data: due === "3d" ? { remind3dSentAt: now } : { remind1dSentAt: now },
      });
      await prisma.notificationLog.create({ data: { userId: r.donorId, kind: `care:remind:${due}`, critical: false } });
      await sendPushToUser(r.donorId, {
        title: due === "1d" ? "You are giving blood tomorrow" : "You are giving blood in 3 days",
        body: `Thank you for saying Yes for ${fmt(d.scheduledFor)}. Open for the details.`,
        url: "/care/requests",
        tag: `care-remind-${d.id}`,
      }).catch(() => null);
      donorReminders++;
    }

    // The family, once, when the rota is short a week out.
    if (familyReminderDue(now, d, yes.length)) {
      await prisma.transfusionDate.update({ where: { id: d.id }, data: { familyReminderSentAt: now } });
      await sendPushToUser(d.careProfile.ownerId, {
        title: "Your rota is short",
        body: `${yes.length} of ${d.donorsNeeded} donors confirmed for ${fmt(d.scheduledFor)}. Ask a few more people from your Pod.`,
        url: `/care/${d.careProfile.id}`,
        tag: `care-family-${d.id}`,
      }).catch(() => null);
      familyReminders++;
    }
  }

  return NextResponse.json({ donorReminders, familyReminders });
}
