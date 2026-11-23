import type { BloodType, ConditionType, ConditionVisibility, RotaStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { userCan } from "@/lib/plan-access";
import { sendPushToUser } from "@/lib/push";
import {
  askLimit,
  canNotify,
  daysUntilEligible,
  donorAskView,
  eligibleOnDate,
  nextDateAfter,
  rotaCounts,
  validDateRange,
  type DonorAskView,
} from "@/lib/care-rules";

export { entitlementSubject, userCan } from "@/lib/plan-access";

/** Every success carries the id of what was changed, plus whatever else the call returns. */
export type Result<T = unknown> = ({ ok: true; id: string } & T) | { ok: false; error: string; status: number };
const fail = (error: string, status = 400): { ok: false; error: string; status: number } => ({ ok: false, error, status });

const MAX_CARE_PROFILES = 5;
const DAY = 86_400_000;

const tell = (userId: string, title: string, body: string, url: string, tag: string) =>
  sendPushToUser(userId, { title, body, url, tag }).catch(() => null);

// ── Create ────────────────────────────────────────────────────────────────────

export interface CreateCareInput {
  displayName: string;
  conditionType: ConditionType;
  conditionVisibility: ConditionVisibility;
  bloodType: BloodType;
  hospitalName: string | null;
  transfusionIntervalDays: number | null;
  nextTransfusionAt: Date;
  donorsNeeded: number;
  podId: string | null;
}

export async function createCareProfile(ownerId: string, input: CreateCareInput): Promise<Result> {
  if (!(await userCan(ownerId, "care_dashboard"))) return fail("A Care Pod needs a Care Pod subscription.", 402);
  if (!validDateRange(input.nextTransfusionAt)) return fail("Pick a date in the next year.");

  const [count, pod] = await Promise.all([
    prisma.careProfile.count({ where: { ownerId, kind: "CARE" } }),
    input.podId ? prisma.pod.findFirst({ where: { id: input.podId, ownerId }, select: { id: true } }) : null,
  ]);
  if (count >= MAX_CARE_PROFILES) return fail(`You can have up to ${MAX_CARE_PROFILES} Care Pods.`, 409);
  if (input.podId && !pod) return fail("Choose one of your own Pods.", 404);

  const now = new Date();
  const profile = await prisma.careProfile.create({
    data: {
      ownerId,
      podId: pod?.id ?? null,
      kind: "CARE",
      displayName: input.displayName,
      conditionType: input.conditionType,
      conditionVisibility: input.conditionVisibility,
      bloodType: input.bloodType,
      hospitalName: input.hospitalName,
      transfusionIntervalDays: input.transfusionIntervalDays,
      nextTransfusionAt: input.nextTransfusionAt,
      donorsNeeded: input.donorsNeeded,
      consentAt: now,
      transfusionDates: {
        create: { scheduledFor: input.nextTransfusionAt, donorsNeeded: input.donorsNeeded },
      },
    },
    select: { id: true },
  });
  return { ok: true, id: profile.id };
}

// ── Dates ─────────────────────────────────────────────────────────────────────

async function ownedProfile(ownerId: string, id: string) {
  return prisma.careProfile.findFirst({ where: { id, ownerId } });
}

export async function addTransfusionDate(ownerId: string, profileId: string, scheduledFor: Date, donorsNeeded?: number): Promise<Result> {
  const profile = await ownedProfile(ownerId, profileId);
  if (!profile) return fail("Not found", 404);
  if (!(await userCan(ownerId, "care_dashboard"))) return fail("Your Care Pod subscription has ended.", 402);
  if (!validDateRange(scheduledFor)) return fail("Pick a date in the next year.");

  const date = await prisma.transfusionDate.create({
    data: { careProfileId: profile.id, scheduledFor, donorsNeeded: donorsNeeded ?? profile.donorsNeeded },
    select: { id: true },
  });
  await syncNextDate(profile.id);
  return { ok: true, id: date.id };
}

/** nextTransfusionAt always points at the soonest date that has not happened yet. */
async function syncNextDate(profileId: string) {
  const next = await prisma.transfusionDate.findFirst({
    where: { careProfileId: profileId, completedAt: null, scheduledFor: { gte: new Date(Date.now() - DAY) } },
    orderBy: { scheduledFor: "asc" },
    select: { scheduledFor: true },
  });
  await prisma.careProfile.update({ where: { id: profileId }, data: { nextTransfusionAt: next?.scheduledFor ?? null } });
}

/** Marks a transfusion done and, when the profile has an interval, books the next one. */
export async function completeTransfusion(ownerId: string, profileId: string, dateId: string): Promise<Result> {
  const profile = await ownedProfile(ownerId, profileId);
  if (!profile) return fail("Not found", 404);
  if (!(await userCan(ownerId, "care_dashboard"))) return fail("Your Care Pod subscription has ended.", 402);

  const date = await prisma.transfusionDate.findFirst({ where: { id: dateId, careProfileId: profile.id } });
  if (!date) return fail("Not found", 404);
  if (date.completedAt) return fail("Already marked as done.", 409);

  await prisma.transfusionDate.update({ where: { id: date.id }, data: { completedAt: new Date() } });

  if (profile.transfusionIntervalDays) {
    const upcoming = await prisma.transfusionDate.count({
      where: { careProfileId: profile.id, completedAt: null, scheduledFor: { gt: date.scheduledFor } },
    });
    if (!upcoming) {
      await prisma.transfusionDate.create({
        data: {
          careProfileId: profile.id,
          scheduledFor: nextDateAfter(date.scheduledFor, profile.transfusionIntervalDays),
          donorsNeeded: profile.donorsNeeded,
        },
      });
    }
  }
  await syncNextDate(profile.id);
  return { ok: true, id: date.id };
}

// ── Rota ──────────────────────────────────────────────────────────────────────

/**
 * The family asks eligible Pod members for one date. A donor is asked once per date (the database
 * enforces it). Asking never depends on the donor's plan, and a donor with three notifications
 * already today still sees the request in the app, just without another push.
 */
export async function askDonors(ownerId: string, profileId: string, dateId: string, donorIds: string[]): Promise<Result<{ asked: number }>> {
  const profile = await ownedProfile(ownerId, profileId);
  if (!profile) return fail("Not found", 404);
  if (!profile.podId) return fail("Link a Pod to this Care Pod first.", 409);
  if (!(await userCan(ownerId, "donor_rota"))) return fail("Your Care Pod subscription has ended.", 402);

  const date = await prisma.transfusionDate.findFirst({
    where: { id: dateId, careProfileId: profile.id },
    include: { rota: { select: { donorId: true } } },
  });
  if (!date) return fail("Not found", 404);
  if (date.completedAt || date.scheduledFor.getTime() < Date.now() - DAY) return fail("That date has passed.", 409);

  const already = new Set(date.rota.map((r) => r.donorId));
  const fresh = [...new Set(donorIds)].filter((id) => !already.has(id));
  if (!fresh.length) return fail("Those donors were already asked.", 409);
  if (already.size + fresh.length > askLimit(date.donorsNeeded)) {
    return fail(`You can ask up to ${askLimit(date.donorsNeeded)} people for one date. Wait for answers first.`, 429);
  }

  // Only people in the linked Pod, and only those who could give on the day.
  const members = await prisma.podMember.findMany({
    where: { podId: profile.podId, userId: { in: fresh } },
    select: { user: { select: { id: true, bloodType: true, nextEligible: true, hospitalId: true, labId: true } } },
  });
  const ok = members
    .map((m) => m.user)
    .filter((u) => !u.hospitalId && !u.labId && eligibleOnDate(u, profile.bloodType, date.scheduledFor))
    .map((u) => u.id);
  if (!ok.length) return fail("None of those people can give on that date.", 409);

  const created = await prisma.rotaEntry.createMany({
    data: ok.map((donorId) => ({ donorId, transfusionDateId: date.id })),
    skipDuplicates: true,
  });

  const since = new Date(Date.now() - DAY);
  const owner = await prisma.user.findUnique({ where: { id: ownerId }, select: { name: true } });
  const first = owner?.name?.trim().split(/\s+/)[0] ?? "Someone";
  await Promise.all(
    ok.map(async (donorId) => {
      const recent = await prisma.notificationLog.count({ where: { userId: donorId, critical: false, createdAt: { gt: since } } });
      if (!canNotify(recent)) return;
      await prisma.notificationLog.create({ data: { userId: donorId, kind: "care:ask", critical: false } });
      await tell(donorId, `${first} needs your help`, "Can you give blood on a date in your Pod? Open to see when.", "/care/requests", `care-ask-${date.id}`);
    }),
  );

  return { ok: true, asked: created.count, id: date.id };
}

/** A donor answers. Their details reach the family only once this is a Yes. */
export async function answerAsk(donorId: string, entryId: string, answer: "yes" | "no"): Promise<Result<{ status: RotaStatus }>> {
  const entry = await prisma.rotaEntry.findUnique({
    where: { id: entryId },
    include: { transfusionDate: { include: { careProfile: { select: { ownerId: true, displayName: true } }, rota: { select: { status: true } } } } },
  });
  // Anyone who is not the asked donor gets the same answer as for a request that does not exist.
  if (!entry || entry.donorId !== donorId) return fail("Not found", 404);
  const date = entry.transfusionDate;
  if (date.completedAt || date.scheduledFor.getTime() < Date.now() - DAY) return fail("That date has passed.", 409);

  // A donor may change their mind, so a Yes can become a No and back until the day.
  const status: RotaStatus = answer === "yes" ? "YES" : "NO";
  if (entry.status === status) return { ok: true, id: entry.id, status };

  await prisma.rotaEntry.update({ where: { id: entry.id }, data: { status, respondedAt: new Date() } });

  const yes = date.rota.filter((r) => r.status === "YES").length + (status === "YES" ? 1 : 0) - (entry.status === "YES" ? 1 : 0);
  await tell(
    date.careProfile.ownerId,
    status === "YES" ? "A donor said Yes" : "A donor can no longer give",
    `${yes} of ${date.donorsNeeded} donors confirmed for ${date.scheduledFor.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}.`,
    `/care/${entry.transfusionDate.careProfileId}`,
    `care-rota-${date.id}`,
  );
  return { ok: true, id: entry.id, status };
}

// ── Reads ─────────────────────────────────────────────────────────────────────

export interface RotaPerson {
  entryId: string;
  userId: string;
  name: string | null;
  phone: string | null;
  bloodType: BloodType | null;
}

export interface DateView {
  id: string;
  scheduledFor: Date;
  donorsNeeded: number;
  completedAt: Date | null;
  counts: ReturnType<typeof rotaCounts>;
  /** Only donors who said Yes, with their details. Everyone else is a count. */
  confirmed: RotaPerson[];
  askedIds: string[];
}

export interface PodDonorView {
  userId: string;
  name: string | null;
  bloodType: BloodType | null;
  eligible: boolean;
  /** Days after the next date until they could give; 0 when they can on the day. */
  eligibleInDays: number;
}

export async function getCareDashboard(ownerId: string, id: string) {
  const profile = await prisma.careProfile.findFirst({
    where: { id, ownerId },
    include: {
      transfusionDates: {
        orderBy: { scheduledFor: "asc" },
        include: { rota: { include: { donor: { select: { id: true, name: true, phone: true, bloodType: true } } } } },
      },
    },
  });
  if (!profile) return null;

  const dates: DateView[] = profile.transfusionDates.map((d) => ({
    id: d.id,
    scheduledFor: d.scheduledFor,
    donorsNeeded: d.donorsNeeded,
    completedAt: d.completedAt,
    counts: rotaCounts(d.rota),
    confirmed: d.rota
      .filter((r) => r.status === "YES")
      .map((r) => ({ entryId: r.id, userId: r.donor.id, name: r.donor.name, phone: r.donor.phone, bloodType: r.donor.bloodType })),
    askedIds: d.rota.map((r) => r.donorId),
  }));

  const next = dates.find((d) => !d.completedAt && d.scheduledFor.getTime() >= Date.now() - DAY) ?? null;

  let pod: { id: string; name: string } | null = null;
  let donors: PodDonorView[] = [];
  if (profile.podId) {
    const p = await prisma.pod.findUnique({
      where: { id: profile.podId },
      select: {
        id: true,
        name: true,
        members: { select: { user: { select: { id: true, name: true, bloodType: true, nextEligible: true, hospitalId: true, labId: true } } } },
      },
    });
    if (p) {
      pod = { id: p.id, name: p.name };
      const when = next?.scheduledFor ?? new Date();
      donors = p.members
        .map((m) => m.user)
        .filter((u) => !u.hospitalId && !u.labId && u.bloodType)
        .map((u) => ({
          userId: u.id,
          name: u.name,
          bloodType: u.bloodType,
          eligible: eligibleOnDate(u, profile.bloodType, when),
          eligibleInDays: daysUntilEligible(u, when),
        }))
        .sort((a, b) => Number(b.eligible) - Number(a.eligible) || a.eligibleInDays - b.eligibleInDays);
    }
  }

  return { profile, dates, next, pod, donors };
}

export async function getMyCareAsks(donorId: string): Promise<{ entryId: string; status: RotaStatus; view: DonorAskView }[]> {
  const rows = await prisma.rotaEntry.findMany({
    where: {
      donorId,
      status: { in: ["REQUESTED", "YES"] },
      transfusionDate: { completedAt: null, scheduledFor: { gte: new Date(Date.now() - DAY) } },
    },
    orderBy: { transfusionDate: { scheduledFor: "asc" } },
    include: {
      transfusionDate: {
        include: {
          careProfile: {
            select: { bloodType: true, hospitalName: true, organisation: { select: { name: true } }, owner: { select: { name: true } } },
          },
        },
      },
    },
  });
  return rows.map((r) => ({
    entryId: r.id,
    status: r.status,
    view: donorAskView({
      bloodType: r.transfusionDate.careProfile.bloodType,
      scheduledFor: r.transfusionDate.scheduledFor,
      donorsNeeded: r.transfusionDate.donorsNeeded,
      hospitalName: r.transfusionDate.careProfile.hospitalName,
      organisationName: r.transfusionDate.careProfile.organisation?.name ?? null,
      ownerName: r.transfusionDate.careProfile.owner.name,
    }),
  }));
}

/** How many dates a donor has been asked about and not yet answered. */
export function countCareAsksWaiting(donorId: string) {
  return prisma.rotaEntry.count({
    where: {
      donorId,
      status: "REQUESTED",
      transfusionDate: { completedAt: null, scheduledFor: { gte: new Date(Date.now() - DAY) } },
    },
  });
}

export async function getMyCareProfiles(ownerId: string) {
  return prisma.careProfile.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
    select: { id: true, displayName: true, bloodType: true, nextTransfusionAt: true, kind: true },
  });
}
