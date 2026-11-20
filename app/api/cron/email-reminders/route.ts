import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bookingReminderContent, eligibleAgainContent, sendNow } from "@/lib/email/notify";

export const dynamic = "force-dynamic";

const DAY = 86_400_000;
const ELIGIBLE_KIND = "email:eligible-again";
const reminderKind = (bookingId: string) => `email:booking-reminder:${bookingId}`;

/**
 * Runs once a day (see vercel.json). Two reminders that no one clicks a button for:
 * "you can donate again" and "your lab visit is tomorrow".
 *
 * Each send is written to NotificationLog first-hand, so a second run the same day (or a retry)
 * does not email anyone twice.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  let eligible = 0;
  let reminders = 0;

  // 1. Eligible again. A 3-day window means one missed run does not skip anyone.
  const due = await prisma.user.findMany({
    where: {
      nextEligible: { lte: now, gte: new Date(now.getTime() - 3 * DAY) },
      onboardingComplete: true,
      hospitalId: null,
      labId: null,
    },
    select: { id: true, email: true, name: true, nextEligible: true },
    take: 500,
  });
  if (due.length) {
    const already = await prisma.notificationLog.findMany({
      where: { kind: ELIGIBLE_KIND, userId: { in: due.map((u) => u.id) } },
      select: { userId: true, createdAt: true },
    });
    for (const u of due) {
      // A log from before this eligibility date belongs to an earlier donation.
      if (already.some((l) => l.userId === u.id && u.nextEligible && l.createdAt > u.nextEligible)) continue;
      await prisma.notificationLog.create({ data: { userId: u.id, kind: ELIGIBLE_KIND } });
      if (await sendNow(u.email, eligibleAgainContent({ name: u.name }), `eligible-again/${u.id}/${u.nextEligible?.getTime()}`)) eligible++;
    }
  }

  // 2. Lab visits tomorrow.
  const startOfTomorrow = new Date(now);
  startOfTomorrow.setUTCHours(0, 0, 0, 0);
  startOfTomorrow.setTime(startOfTomorrow.getTime() + DAY);
  const bookings = await prisma.booking.findMany({
    where: { status: "CONFIRMED", scheduledFor: { gte: startOfTomorrow, lt: new Date(startOfTomorrow.getTime() + DAY) } },
    include: { lab: { select: { name: true } }, user: { select: { id: true, email: true, name: true } } },
    take: 500,
  });
  if (bookings.length) {
    const sent = await prisma.notificationLog.findMany({
      where: { kind: { in: bookings.map((b) => reminderKind(b.id)) } },
      select: { kind: true },
    });
    const done = new Set(sent.map((s) => s.kind));
    for (const b of bookings) {
      if (done.has(reminderKind(b.id))) continue;
      await prisma.notificationLog.create({ data: { userId: b.user.id, kind: reminderKind(b.id) } });
      const ok = await sendNow(
        b.user.email,
        bookingReminderContent({ name: b.user.name, labName: b.lab.name, testName: b.testName, when: b.scheduledFor }),
        `booking-reminder/${b.id}`,
      );
      if (ok) reminders++;
    }
  }

  return NextResponse.json({ eligibleAgain: eligible, bookingReminders: reminders });
}
