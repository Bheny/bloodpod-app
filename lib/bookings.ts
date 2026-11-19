import type { BookingStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";
import { parseLabTests, testLabel, isServiceTestId } from "@/lib/service-tests";

/** Open requests one person can have at once, so the labs' inboxes can't be flooded. */
export const MAX_OPEN_BOOKINGS = 5;

const OPEN: BookingStatus[] = ["REQUESTED", "RESCHEDULED", "CONFIRMED"];

type Result = { ok: true; id: string } | { ok: false; error: string; status: number };
const fail = (error: string, status = 400): Result => ({ ok: false, error, status });

/** Push is a nice-to-have: a missing VAPID key or dead device must never fail a booking. */
async function tell(userIds: string[], title: string, body: string, url: string) {
  await Promise.all(
    userIds.map((id) => sendPushToUser(id, { title, body, url, tag: `booking-${url}` }).catch(() => null)),
  );
}

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export async function createBooking(
  user: { id: string; name: string | null },
  input: { labId: string; testIds: string[]; preferredDate: string; note?: string; consent: boolean },
): Promise<Result> {
  if (!input.consent) return fail("Please agree to share your name and phone with the lab");

  const testIds = [...new Set(input.testIds)].filter(isServiceTestId);
  if (testIds.length === 0) return fail("Pick at least one test");

  const preferred = new Date(input.preferredDate);
  if (Number.isNaN(preferred.getTime()) || preferred < startOfToday()) return fail("Pick a day from today onwards");
  if (preferred.getTime() - Date.now() > 1000 * 60 * 60 * 24 * 120) return fail("Pick a day within the next 4 months");

  const lab = await prisma.lab.findUnique({ where: { id: input.labId }, include: { staff: { select: { id: true } } } });
  if (!lab || !lab.active) return fail("That lab isn't available", 404);

  const offered = new Set(parseLabTests(lab.tests).map((t) => t.id));
  if (!testIds.every((t) => offered.has(t))) return fail("That lab doesn't offer all of those tests");

  const open = await prisma.booking.count({ where: { userId: user.id, status: { in: OPEN } } });
  if (open >= MAX_OPEN_BOOKINGS) return fail(`You already have ${MAX_OPEN_BOOKINGS} open requests. Cancel one first.`, 429);

  const booking = await prisma.booking.create({
    data: {
      userId: user.id,
      labId: lab.id,
      testIds,
      testName: testIds.map(testLabel).join(", "),
      preferredDate: preferred,
      note: input.note?.trim().slice(0, 300) || null,
      consentAt: new Date(),
    },
  });

  await tell(
    lab.staff.map((s) => s.id),
    "New test request",
    `${user.name ?? "Someone"} wants ${booking.testName}`,
    "/lab",
  );
  return { ok: true, id: booking.id };
}

/** A person's own response: cancel anything open, or accept a time the lab proposed. */
export async function respondAsUser(userId: string, bookingId: string, action: "cancel" | "accept"): Promise<Result> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { lab: { include: { staff: { select: { id: true } } } }, user: { select: { name: true } } },
  });
  if (!booking || booking.userId !== userId) return fail("Booking not found", 404);

  if (action === "cancel") {
    if (!OPEN.includes(booking.status)) return fail("That booking is already closed");
    await prisma.booking.update({ where: { id: bookingId }, data: { status: "CANCELLED" } });
    await tell(booking.lab.staff.map((s) => s.id), "Request cancelled", `${booking.user.name ?? "A person"} cancelled ${booking.testName}`, "/lab");
    return { ok: true, id: bookingId };
  }

  if (booking.status !== "RESCHEDULED" || !booking.scheduledFor) return fail("There's no new time to accept");
  await prisma.booking.update({ where: { id: bookingId }, data: { status: "CONFIRMED" } });
  await tell(booking.lab.staff.map((s) => s.id), "New time accepted", `${booking.user.name ?? "A person"} accepted the time for ${booking.testName}`, "/lab");
  return { ok: true, id: bookingId };
}

export type LabAction = "accept" | "propose" | "decline" | "complete" | "cancel";

/** A lab's response. Only staff of the booking's own lab get past the first check. */
export async function respondAsLab(
  staff: { labId: string | null },
  bookingId: string,
  action: LabAction,
  opts: { scheduledFor?: string; note?: string },
): Promise<Result> {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { lab: { select: { name: true } } } });
  if (!staff.labId || !booking || booking.labId !== staff.labId) return fail("Booking not found", 404);

  const note = opts.note?.trim().slice(0, 300) || null;
  const now = new Date();
  let data: Prisma.BookingUpdateInput;
  let message: [string, string] | null = null;

  if (action === "accept") {
    if (booking.status !== "REQUESTED") return fail("Only new requests can be accepted");
    data = { status: "CONFIRMED", scheduledFor: booking.preferredDate, respondedAt: now, labNote: note };
    message = ["Test confirmed", `${booking.lab.name} confirmed your ${booking.testName}`];
  } else if (action === "propose") {
    if (booking.status !== "REQUESTED") return fail("Only new requests can get a new time");
    const when = new Date(opts.scheduledFor ?? "");
    if (Number.isNaN(when.getTime()) || when < startOfToday()) return fail("Pick a day from today onwards");
    data = { status: "RESCHEDULED", scheduledFor: when, respondedAt: now, labNote: note };
    message = ["New time suggested", `${booking.lab.name} suggested another day for your ${booking.testName}`];
  } else if (action === "decline") {
    if (booking.status !== "REQUESTED" && booking.status !== "RESCHEDULED") return fail("That request is already closed");
    data = { status: "DECLINED", respondedAt: now, labNote: note };
    message = ["Request declined", `${booking.lab.name} can't do your ${booking.testName}`];
  } else if (action === "complete") {
    if (booking.status !== "CONFIRMED") return fail("Only confirmed visits can be completed");
    data = { status: "COMPLETED", completedAt: now };
  } else {
    if (booking.status !== "CONFIRMED") return fail("Only confirmed visits can be cancelled");
    data = { status: "CANCELLED", labNote: note };
    message = ["Visit cancelled", `${booking.lab.name} cancelled your ${booking.testName}`];
  }

  await prisma.booking.update({ where: { id: bookingId }, data });
  if (message) await tell([booking.userId], message[0], message[1], "/services/bookings");
  return { ok: true, id: bookingId };
}

export async function getUserBookings(userId: string) {
  return prisma.booking.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { lab: { select: { name: true, town: true, phone: true, address: true } } },
  });
}

export async function getLabInbox(labId: string) {
  return prisma.booking.findMany({
    where: { labId },
    orderBy: { createdAt: "desc" },
    take: 200,
    // Name and phone are shared because the person agreed to that when they asked (consentAt).
    include: { user: { select: { name: true, phone: true } } },
  });
}
