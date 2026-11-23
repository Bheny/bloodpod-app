import type { AlertScope, BloodRequest, BloodType, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";
import { logActivity } from "@/lib/activity";
import { isAdminEmail } from "@/lib/admin/auth";
import { isBloodType, BLOOD_TYPE_LABELS } from "@/lib/blood-type";
import { phoneKey } from "@/lib/readiness/members";
import { emailEmergencyAlert, emailEmergencyUpdate } from "@/lib/email/notify";
import {
  ALERT,
  URGENCY_LABEL,
  canBeAsked,
  cleanAlertInput,
  comingCount,
  donorTypesFor,
  effectiveStatus,
  expiryFor,
  firstName,
  isLive,
  pickNearby,
  requesterView,
  responderView,
  secondsToFirstYes,
  shouldWiden,
  widenAtFor,
} from "@/lib/alert-rules";

/**
 * The alert system: raise a request, tell the Pod, widen to donors nearby if nobody answers, take the
 * answers, and close. Every step that two people could race on (widening, answering, closing) is
 * guarded in the database, so a double tap or two servers cannot send or count anything twice.
 */

type Result<T> = ({ ok: true } & T) | { ok: false; error: string; status: number; id?: string };
const fail = (error: string, status = 400, id?: string) => ({ ok: false as const, error, status, id });

const DAY = 86_400_000;

const askSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  city: true,
  latitude: true,
  longitude: true,
  onboardingComplete: true,
  isAvailable: true,
  isEligible: true,
  nextEligible: true,
  bloodType: true,
  hospitalId: true,
  labId: true,
} as const;

type Asked = Pick<User, "id" | "email" | "name" | "phone" | "city" | "latitude" | "longitude" | "onboardingComplete" | "isAvailable" | "isEligible" | "nextEligible" | "bloodType" | "hospitalId" | "labId">;

const label = (t: BloodType) => BLOOD_TYPE_LABELS[t];

/** Everyone in the Pods this person owns or belongs to, other than themselves. */
async function podmates(requesterId: string): Promise<string[]> {
  const pods = await prisma.pod.findMany({
    where: { OR: [{ ownerId: requesterId }, { members: { some: { userId: requesterId } } }] },
    select: { ownerId: true, members: { select: { userId: true } } },
  });
  const ids = new Set<string>();
  for (const p of pods) {
    ids.add(p.ownerId);
    for (const m of p.members) ids.add(m.userId);
  }
  ids.delete(requesterId);
  return [...ids];
}

/** Who a request would reach in the Pod right now: askable, compatible, once each by account and by phone. */
async function podAudience(requesterId: string, needed: BloodType, now = new Date()): Promise<Asked[]> {
  const ids = await podmates(requesterId);
  if (ids.length === 0) return [];
  const users = await prisma.user.findMany({ where: { id: { in: ids } }, select: askSelect });
  const seen = new Set<string>();
  const out: Asked[] = [];
  for (const u of users.filter((x) => canBeAsked(x, needed, now))) {
    const pk = phoneKey(u.phone);
    if (pk && seen.has(pk)) continue;
    if (pk) seen.add(pk);
    out.push(u);
  }
  return out;
}

/** For the request form: how many people the Pod would reach, so the person sees it before sending. */
export async function previewReach(requesterId: string, needed: BloodType) {
  return { pod: (await podAudience(requesterId, needed)).length };
}

/** Sends the alert to each person: a push to every device, and an email to anyone with no device. Records how each went. */
async function notify(req: Pick<BloodRequest, "id" | "bloodType" | "urgency" | "facility" | "location" | "isTest">, requesterFirst: string | null, people: Asked[], scope: AlertScope) {
  const bt = label(req.bloodType);
  const urgent = URGENCY_LABEL[req.urgency];
  const where = [req.facility, req.location].filter(Boolean).join(", ");
  const test = req.isTest ? "TEST: " : "";
  const title = scope === "POD" && requesterFirst ? `${test}${requesterFirst} needs ${bt} blood` : `${test}${urgent}: ${bt} blood needed`;
  const body = `${where}. Tap to say if you can come.`;

  let pushed = 0;
  let emailed = 0;
  await Promise.all(
    people.map(async (p) => {
      const r = await sendPushToUser(p.id, {
        title,
        body,
        url: `/dashboard/alert/${req.id}`,
        tag: `alert-${req.id}`,
        critical: req.urgency === "CRITICAL",
      }).catch(() => null);
      const gotPush = !!r && r.sent > 0;
      // No device to ping: fall back to email, so being away from the app does not mean being missed.
      const gotEmail = !gotPush && !!p.email && !req.isTest;
      if (gotEmail) {
        emailEmergencyAlert({ to: p.email, requestId: req.id, name: p.name, bloodType: bt, urgency: req.urgency, facility: req.facility, location: req.location });
      }
      if (gotPush) pushed++;
      if (gotEmail) emailed++;
      await prisma.bloodRequestRecipient.updateMany({ where: { requestId: req.id, userId: p.id }, data: { pushed: gotPush, emailed: gotEmail } });
    }),
  );
  return { pushed, emailed };
}

async function addRecipients(requestId: string, people: Asked[], scope: AlertScope) {
  if (people.length === 0) return;
  await prisma.bloodRequestRecipient.createMany({ data: people.map((p) => ({ requestId, userId: p.id, scope })), skipDuplicates: true });
}

// ------------------------------------------------------------------ raise

export async function createAlert(user: User, raw: Record<string, unknown>, opts: { test?: boolean } = {}): Promise<Result<{ id: string; alerted: number; widenedNow: boolean }>> {
  if (user.hospitalId || user.labId) return fail("Hospitals and labs use their own portal to reach donors.", 403);
  if (!user.onboardingComplete) return fail("Finish setting up your profile first.", 403);
  if (!user.phone) return fail("Add your phone number to your profile first, so the people who come can reach you.", 400);

  const test = Boolean(opts.test);
  if (test && !isAdminEmail(user.email)) return fail("Not found", 404);

  const clean = cleanAlertInput(raw, isBloodType);
  if (!clean.ok) return fail(clean.error);
  const input = clean.value;
  const now = new Date();

  if (!test) {
    const [open, today] = await Promise.all([
      prisma.bloodRequest.findFirst({
        where: { requesterId: user.id, isTest: false, status: "OPEN", OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
        select: { id: true },
      }),
      prisma.bloodRequest.count({ where: { requesterId: user.id, isTest: false, createdAt: { gt: new Date(now.getTime() - DAY) } } }),
    ]);
    if (open) return fail("You already have a request open. Close it first, or follow it.", 409, open.id);
    if (today >= ALERT.perDay) return fail("You have raised a lot of requests today. If it is still urgent, call the hospital's blood bank directly.", 429);
  }

  const audience = await podAudience(user.id, input.bloodType, now);
  // A test also reaches the person who sent it, so they can see it land on their own phone.
  const askedSelf: Asked[] = test ? [{ ...(await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: askSelect })) }] : [];
  const podPeopleToAsk = [...askedSelf, ...audience.filter((a) => a.id !== user.id)];

  const req = await prisma.bloodRequest.create({
    data: {
      requesterId: user.id,
      bloodType: input.bloodType,
      urgency: input.urgency,
      facility: input.facility,
      location: input.location,
      message: input.message,
      isTest: test,
      expiresAt: expiryFor(input.urgency, now),
      // With nobody in the Pod to ask, there is nothing to wait for: widen straight away.
      widenAt: test ? null : audience.length === 0 ? now : widenAtFor(input.urgency, now),
    },
  });

  await addRecipients(req.id, podPeopleToAsk, "POD");
  await notify(req, firstName(user.name), podPeopleToAsk, "POD");
  await logActivity(user.id, "BLOOD_REQUEST", `${test ? "Test alert" : "Blood request"}: ${label(input.bloodType)} at ${input.facility}`, `${podPeopleToAsk.length} in your Pod alerted`).catch(() => null);

  let widenedNow = false;
  if (!test && audience.length === 0) widenedNow = (await widenAlert(req.id, { force: true })).ok;

  return { ok: true, id: req.id, alerted: podPeopleToAsk.length, widenedNow };
}

// ----------------------------------------------------------------- widen

/** Asks matching donors nearby who chose to be listed. Runs once per request, whoever calls it. */
export async function widenAlert(requestId: string, opts: { force?: boolean } = {}): Promise<Result<{ alerted: number }>> {
  const req = await prisma.bloodRequest.findUnique({
    where: { id: requestId },
    include: { recipients: { select: { userId: true, answer: true } }, requester: { select: { name: true, city: true, latitude: true, longitude: true } } },
  });
  if (!req) return fail("Not found", 404);
  const now = new Date();
  if (!opts.force && !shouldWiden(req, req.recipients, now)) return fail("Not due", 409);
  if (req.isTest || !isLive(req, now)) return fail("Not due", 409);

  // Whoever flips widenedAt first does the sending. A second caller finds it already set and stops.
  const claimed = await prisma.bloodRequest.updateMany({ where: { id: requestId, widenedAt: null }, data: { widenedAt: now } });
  if (claimed.count !== 1) return fail("Already widened", 409);

  const skip = new Set([req.requesterId, ...req.recipients.map((r) => r.userId)]);
  const pool = await prisma.user.findMany({
    where: {
      id: { notIn: [...skip] },
      isPublic: true,
      onboardingComplete: true,
      isAvailable: true,
      isEligible: true,
      hospitalId: null,
      labId: null,
      bloodType: { in: donorTypesFor(req.bloodType) },
      OR: [
        { latitude: { not: null }, longitude: { not: null } },
        ...(req.requester.city ? [{ city: { equals: req.requester.city, mode: "insensitive" as const } }] : []),
      ],
    },
    select: askSelect,
    take: 600,
  });
  const eligible = pool.filter((p) => canBeAsked(p, req.bloodType, now));
  const picked = pickNearby(eligible, req.requester, skip);

  await addRecipients(requestId, picked, "NEARBY");
  await notify(req, null, picked, "NEARBY");
  return { ok: true, alerted: picked.length };
}

/** Widens every request whose time has come. Called whenever someone loads their alerts, and daily as a backstop. */
export async function widenDueAlerts(limit = 10): Promise<number> {
  const now = new Date();
  const due = await prisma.bloodRequest.findMany({
    where: { status: "OPEN", isTest: false, widenedAt: null, widenAt: { lte: now }, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
    select: { id: true },
    take: limit,
  });
  let done = 0;
  for (const d of due) if ((await widenAlert(d.id)).ok) done++;
  return done;
}

// ---------------------------------------------------------------- answer

export async function answerAlert(userId: string, requestId: string, answer: "COMING" | "CANT"): Promise<Result<{ answer: "COMING" | "CANT"; requesterPhone: string | null }>> {
  const row = await prisma.bloodRequestRecipient.findUnique({
    where: { requestId_userId: { requestId, userId } },
    include: { request: { include: { requester: { select: { id: true, name: true, phone: true } } } }, user: { select: { name: true } } },
  });
  // Anyone who was not asked gets the same answer as a request that is not there.
  if (!row) return fail("Request not found", 404);
  if (!isLive(row.request)) return fail("This request has closed.", 410);

  const before = row.answer;
  if (before !== answer) {
    await prisma.bloodRequestRecipient.update({ where: { id: row.id }, data: { answer, answeredAt: new Date() } });

    const first = firstName(row.user.name) ?? "Someone";
    if (answer === "COMING") {
      await sendPushToUser(row.request.requesterId, {
        title: `${first} can come`,
        body: "Open BloodPod to see their number.",
        url: `/dashboard/request/${requestId}`,
        tag: `alert-answer-${requestId}-${userId}`,
        critical: row.request.urgency === "CRITICAL",
      }).catch(() => null);
      await logActivity(userId, "BLOOD_REQUEST", `You said you can come: ${label(row.request.bloodType)} at ${row.request.facility}`).catch(() => null);
    } else if (before === "COMING") {
      await sendPushToUser(row.request.requesterId, {
        title: `${first} can no longer come`,
        body: "Open BloodPod to see who else is on the way.",
        url: `/dashboard/request/${requestId}`,
        tag: `alert-answer-${requestId}-${userId}`,
      }).catch(() => null);
    }
  }

  return { ok: true, answer, requesterPhone: requesterView({ answer }, row.request.requester).phone };
}

// ----------------------------------------------------------------- close

export async function closeAlert(userId: string, requestId: string, outcome: "FULFILLED" | "CANCELLED"): Promise<Result<{ id: string }>> {
  const req = await prisma.bloodRequest.findUnique({ where: { id: requestId }, include: { recipients: { include: { user: { select: { id: true, email: true, name: true } } } } } });
  if (!req || req.requesterId !== userId) return fail("Request not found", 404);
  if (!isLive(req)) return fail("This request is already closed.", 409);

  // The status guard means two quick taps close it once.
  const done = await prisma.bloodRequest.updateMany({ where: { id: requestId, status: "OPEN" }, data: { status: outcome, closedAt: new Date() } });
  if (done.count !== 1) return fail("This request is already closed.", 409);

  const bt = label(req.bloodType);
  const fulfilled = outcome === "FULFILLED";
  await Promise.all(
    req.recipients.map(async (r) => {
      // Same tag as the alert, so the notification on their phone is replaced rather than left shouting.
      await sendPushToUser(r.userId, {
        title: fulfilled ? "Thank you: the blood is covered" : "The request was closed",
        body: fulfilled ? `${bt} at ${req.facility} is covered. You do not need to come.` : `${bt} at ${req.facility} is no longer needed.`,
        url: "/dashboard",
        tag: `alert-${requestId}`,
      }).catch(() => null);
      if (r.answer === "COMING" && !req.isTest) {
        emailEmergencyUpdate({ to: r.user.email, requestId, name: r.user.name, bloodType: bt, facility: req.facility, outcome });
      }
    }),
  );
  return { ok: true, id: requestId };
}

/** Marks requests whose time ran out as expired. Safe to run any number of times. */
export async function expireAlerts(): Promise<number> {
  const now = new Date();
  const r = await prisma.bloodRequest.updateMany({ where: { status: "OPEN", expiresAt: { lte: now } }, data: { status: "EXPIRED", closedAt: now } });
  return r.count;
}

// ----------------------------------------------------------------- views

export interface RequesterView {
  id: string;
  bloodType: string;
  urgency: "CRITICAL" | "URGENT" | "STANDARD";
  facility: string;
  location: string | null;
  message: string | null;
  isTest: boolean;
  status: "OPEN" | "FULFILLED" | "CANCELLED" | "EXPIRED" | "MATCHED";
  createdAt: string;
  expiresAt: string | null;
  widenedAt: string | null;
  /** When it widens, while that is still ahead. */
  widensAt: string | null;
  podAlerted: number;
  nearbyAlerted: number;
  coming: { userId: string; firstName: string | null; fullName: string | null; phone: string | null; scope: "POD" | "NEARBY"; answeredAt: string | null }[];
  cant: number;
  waiting: number;
  secondsToFirstYes: number | null;
}

export async function getRequesterView(userId: string, id: string): Promise<RequesterView | null> {
  const found = await prisma.bloodRequest.findUnique({ where: { id }, select: { requesterId: true } });
  if (!found || found.requesterId !== userId) return null;
  // Someone looking at their own request is the best moment to widen it if its time has come.
  await widenAlert(id).catch(() => null);

  const req = await prisma.bloodRequest.findUnique({
    where: { id },
    include: { recipients: { include: { user: { select: { name: true, phone: true } } }, orderBy: { notifiedAt: "asc" } } },
  });
  if (!req) return null;

  const status = effectiveStatus(req);
  const now = Date.now();
  const coming = req.recipients
    .filter((r) => r.answer === "COMING")
    .map((r) => {
      const v = responderView(r, r.user);
      return { userId: r.userId, firstName: v.firstName, fullName: v.fullName ?? null, phone: v.phone ?? null, scope: r.scope, answeredAt: r.answeredAt?.toISOString() ?? null };
    });

  return {
    id: req.id,
    bloodType: label(req.bloodType),
    urgency: req.urgency,
    facility: req.facility,
    location: req.location,
    message: req.message,
    isTest: req.isTest,
    status,
    createdAt: req.createdAt.toISOString(),
    expiresAt: req.expiresAt?.toISOString() ?? null,
    widenedAt: req.widenedAt?.toISOString() ?? null,
    widensAt: status === "OPEN" && !req.widenedAt && !req.isTest && req.widenAt && req.widenAt.getTime() > now ? req.widenAt.toISOString() : null,
    podAlerted: req.recipients.filter((r) => r.scope === "POD").length,
    nearbyAlerted: req.recipients.filter((r) => r.scope === "NEARBY").length,
    coming,
    cant: req.recipients.filter((r) => r.answer === "CANT").length,
    waiting: req.recipients.filter((r) => !r.answer).length,
    secondsToFirstYes: secondsToFirstYes(req.createdAt, req.recipients),
  };
}

export interface DonorView {
  id: string;
  bloodType: string;
  urgency: "CRITICAL" | "URGENT" | "STANDARD";
  facility: string;
  location: string | null;
  message: string | null;
  isTest: boolean;
  status: "OPEN" | "FULFILLED" | "CANCELLED" | "EXPIRED" | "MATCHED";
  createdAt: string;
  expiresAt: string | null;
  scope: "POD" | "NEARBY";
  answer: "COMING" | "CANT" | null;
  requester: { firstName: string | null; phone: string | null };
  othersComing: number;
}

export async function getDonorView(userId: string, id: string): Promise<DonorView | null> {
  const row = await prisma.bloodRequestRecipient.findUnique({
    where: { requestId_userId: { requestId: id, userId } },
    include: { request: { include: { requester: { select: { name: true, phone: true } }, recipients: { select: { answer: true, userId: true } } } } },
  });
  if (!row) return null;
  const r = row.request;
  return {
    id: r.id,
    bloodType: label(r.bloodType),
    urgency: r.urgency,
    facility: r.facility,
    location: r.location,
    message: r.message,
    isTest: r.isTest,
    status: effectiveStatus(r),
    createdAt: r.createdAt.toISOString(),
    expiresAt: r.expiresAt?.toISOString() ?? null,
    scope: row.scope,
    answer: row.answer,
    requester: requesterView(row, r.requester),
    othersComing: comingCount(r.recipients.filter((x) => x.userId !== userId)),
  };
}
