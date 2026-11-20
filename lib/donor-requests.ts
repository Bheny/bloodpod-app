import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";
import { BLOOD_TYPE_LABELS } from "@/lib/blood-type";
import { emailDonorRequestAccepted, emailDonorRequestReceived } from "@/lib/email/notify";
import {
  effectiveStatus,
  firstNameOf,
  personView,
  REQUEST_RULES,
  requestExpiry,
  type EffectiveStatus,
  type PersonView,
} from "@/lib/donor-requests-rules";

const DAY = 86_400_000;

type Result = { ok: true; id: string } | { ok: false; error: string; status: number };
const fail = (error: string, status = 400): Result => ({ ok: false, error, status });

const tell = (userId: string, title: string, body: string, url: string, tag: string) =>
  sendPushToUser(userId, { title, body, url, tag }).catch(() => null);

/** Ask one donor for help. Only people who chose to be listed by name can be asked. */
export async function createRequest(
  seeker: { id: string; name: string | null; hospitalId: string | null; labId: string | null },
  donorId: string,
  message: string | null,
): Promise<Result> {
  if (seeker.hospitalId || seeker.labId) return fail("Hospitals and labs use their own portal to reach donors", 403);
  if (donorId === seeker.id) return fail("That is you");

  const note = message?.trim().slice(0, REQUEST_RULES.messageMax) || null;
  const now = new Date();

  const donor = await prisma.user.findUnique({
    where: { id: donorId },
    select: { id: true, email: true, name: true, isPublic: true, isEligible: true, hospitalId: true, labId: true, onboardingComplete: true, city: true },
  });
  // Anyone who is not listed by name, or cannot give right now, looks the same as someone who does not exist.
  if (!donor || !donor.isPublic || !donor.isEligible || donor.hospitalId || donor.labId || !donor.onboardingComplete) {
    return fail("That donor can not be asked right now", 404);
  }

  const [open, today, pair] = await Promise.all([
    prisma.donorRequest.count({ where: { seekerId: seeker.id, status: "PENDING", expiresAt: { gt: now } } }),
    prisma.donorRequest.count({ where: { seekerId: seeker.id, createdAt: { gt: new Date(now.getTime() - DAY) } } }),
    prisma.donorRequest.findFirst({ where: { seekerId: seeker.id, donorId }, orderBy: { createdAt: "desc" } }),
  ]);

  if (open >= REQUEST_RULES.openAtOnce) return fail(`You have ${REQUEST_RULES.openAtOnce} requests waiting. Wait for an answer first.`, 429);
  if (today >= REQUEST_RULES.perDay) return fail("You have asked a lot of people today. Try again tomorrow.", 429);

  if (pair) {
    const state = effectiveStatus(pair, now);
    if (state === "PENDING") return fail("You already asked this donor. They have not answered yet.", 409);
    if (state === "ACCEPTED") return fail("This donor already said yes. Your requests page has their details.", 409);
    if (state === "DECLINED" && pair.respondedAt && now.getTime() - pair.respondedAt.getTime() < REQUEST_RULES.retryAfterDeclineDays * DAY) {
      return fail("This donor is not available right now. Try someone else, or ask again in a week.", 409);
    }
  }

  const created = await prisma.donorRequest.create({
    data: { seekerId: seeker.id, donorId, message: note, expiresAt: requestExpiry(now) },
  });

  const seekerFirst = firstNameOf(seeker.name) ?? "Someone";
  await tell(donorId, `${seekerFirst} is asking for your help`, "Open BloodPod to say yes or no. Nothing is shared unless you say yes.", "/profile/notifications", `ask-${created.id}`);
  emailDonorRequestReceived({
    to: donor.email,
    requestId: created.id,
    donorName: donor.name,
    seekerFirstName: seekerFirst,
    message: note,
  });
  return { ok: true, id: created.id };
}

/** The donor answers, or the asker takes the request back. */
export async function respondToRequest(userId: string, requestId: string, action: "accept" | "decline" | "cancel"): Promise<Result> {
  const req = await prisma.donorRequest.findUnique({
    where: { id: requestId },
    include: { seeker: { select: { id: true, name: true, email: true } }, donor: { select: { id: true, name: true } } },
  });
  // Anyone who is not one of the two people gets the same answer as a request that is not there.
  if (!req || (userId !== req.donorId && userId !== req.seekerId)) return fail("Request not found", 404);

  const state = effectiveStatus(req);
  if (state !== "PENDING") return fail(state === "EXPIRED" ? "This request has lapsed." : "This request is already closed.", 409);

  if (action === "cancel") {
    if (userId !== req.seekerId) return fail("Only the person who asked can take it back", 403);
    await prisma.donorRequest.update({ where: { id: requestId }, data: { status: "CANCELLED", respondedAt: new Date() } });
    return { ok: true, id: requestId };
  }

  if (userId !== req.donorId) return fail("Only the donor can answer", 403);
  const accepted = action === "accept";
  // updateMany with the status guard means two quick taps answer it once.
  const done = await prisma.donorRequest.updateMany({
    where: { id: requestId, status: "PENDING" },
    data: { status: accepted ? "ACCEPTED" : "DECLINED", respondedAt: new Date() },
  });
  if (done.count !== 1) return fail("This request is already closed.", 409);

  const donorFirst = firstNameOf(req.donor.name) ?? "The donor";
  if (accepted) {
    await tell(req.seekerId, `${donorFirst} said yes`, "Open BloodPod to see their details.", "/discover/requests", `ask-${requestId}`);
    emailDonorRequestAccepted({ to: req.seeker.email, requestId, seekerName: req.seeker.name, donorFirstName: donorFirst });
  } else {
    await tell(req.seekerId, `${donorFirst} is not available`, "They can not help this time. You can try someone else.", "/discover/requests", `ask-${requestId}`);
  }
  return { ok: true, id: requestId };
}

export interface RequestRow {
  id: string;
  status: EffectiveStatus;
  message: string | null;
  createdAt: Date;
  expiresAt: Date;
  /** The other person: a first name until the donor accepts, then the full name and phone. */
  other: PersonView;
  otherBloodType: string | null;
  otherCity: string | null;
}

const contactSelect = { name: true, phone: true, bloodType: true, city: true } as const;

/** Requests waiting for this donor, plus recently accepted ones. */
export async function getReceivedRequests(userId: string): Promise<RequestRow[]> {
  const now = new Date();
  const rows = await prisma.donorRequest.findMany({
    where: {
      donorId: userId,
      OR: [
        { status: "PENDING", expiresAt: { gt: now } },
        { status: "ACCEPTED", respondedAt: { gt: new Date(now.getTime() - REQUEST_RULES.acceptedVisibleDays * DAY) } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { seeker: { select: contactSelect } },
  });
  return rows.map((r) => ({
    id: r.id,
    status: effectiveStatus(r, now),
    message: r.message,
    createdAt: r.createdAt,
    expiresAt: r.expiresAt,
    other: personView(r, userId, r.seeker, now),
    otherBloodType: r.seeker.bloodType ? BLOOD_TYPE_LABELS[r.seeker.bloodType] : null,
    otherCity: r.seeker.city,
  }));
}

/** Requests this person has sent, newest first. */
export async function getSentRequests(userId: string): Promise<RequestRow[]> {
  const now = new Date();
  const rows = await prisma.donorRequest.findMany({
    where: { seekerId: userId },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { donor: { select: contactSelect } },
  });
  return rows.map((r) => ({
    id: r.id,
    status: effectiveStatus(r, now),
    message: r.message,
    createdAt: r.createdAt,
    expiresAt: r.expiresAt,
    other: personView(r, userId, r.donor, now),
    otherBloodType: r.donor.bloodType ? BLOOD_TYPE_LABELS[r.donor.bloodType] : null,
    otherCity: r.donor.city,
  }));
}

/** How many requests are waiting for this donor, for badges. */
export function countWaitingFor(userId: string) {
  return prisma.donorRequest.count({ where: { donorId: userId, status: "PENDING", expiresAt: { gt: new Date() } } });
}
