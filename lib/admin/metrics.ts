import { Prisma, type BloodType } from "@prisma/client";
import { adb as prisma } from "@/lib/admin/db";
import { BLOOD_TYPE_LABELS } from "@/lib/blood-type";
import { pct } from "@/lib/admin/format";

const DAY = 86_400_000;
/** A Pod is "ready" when at least this many people in it can donate right now. */
export const POD_READY_THRESHOLD = 3;

// Hospital staff are not donors, so they are excluded from donor metrics.
const DONORS = { hospitalId: null } satisfies Prisma.UserWhereInput;

const daysAgo = (n: number) => new Date(Date.now() - n * DAY);

// ---------------------------------------------------------------- series

export type SeriesPoint = { label: string; date: string; value: number };

/** Fills gaps so every day in the window has a point, even with zero signups. */
function fillDays(rows: { day: string; n: number }[], days: number): SeriesPoint[] {
  const byDay = new Map(rows.map((r) => [r.day, r.n]));
  const out: SeriesPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = daysAgo(i);
    const key = d.toISOString().slice(0, 10);
    out.push({
      date: key,
      label: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      value: byDay.get(key) ?? 0,
    });
  }
  return out;
}

export async function getSignupSeries(days: number) {
  const since = daysAgo(days - 1);
  since.setHours(0, 0, 0, 0);

  const [rows, before] = await Promise.all([
    prisma.$queryRaw<{ day: string; n: number }[]>`
      SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS day, count(*)::int AS n
      FROM "User"
      WHERE "hospitalId" IS NULL AND "createdAt" >= ${since}
      GROUP BY 1 ORDER BY 1`,
    prisma.user.count({ where: { ...DONORS, createdAt: { lt: since } } }),
  ]);

  const daily = fillDays(rows, days);
  let running = before;
  const cumulative = daily.map((p) => ({ ...p, value: (running += p.value) }));
  return { daily, cumulative };
}

// -------------------------------------------------------------- overview

export async function getOverview() {
  const d2 = daysAgo(2);
  const d7 = daysAgo(7);
  const d14 = daysAgo(14);
  const d30 = daysAgo(30);
  const d60 = daysAgo(60);

  // One query for every donor count, instead of a dozen separate round trips.
  type UserCounts = {
    donors: number;
    new7: number;
    newPrev7: number;
    new30: number;
    newPrev30: number;
    onboarded: number;
    consented: number;
    withAlerts: number;
    eligible: number;
    available: number;
    withPhone: number;
    stalled: number;
  };

  const [countRows, inviters, pods, hospitalGroups, openEmergencies, mrr, oldestPending, overdue] = await Promise.all([
    prisma.$queryRaw<UserCounts[]>`
      SELECT
        count(*)::int AS donors,
        count(*) FILTER (WHERE u."createdAt" >= ${d7})::int AS new7,
        count(*) FILTER (WHERE u."createdAt" >= ${d14} AND u."createdAt" < ${d7})::int AS "newPrev7",
        count(*) FILTER (WHERE u."createdAt" >= ${d30})::int AS new30,
        count(*) FILTER (WHERE u."createdAt" >= ${d60} AND u."createdAt" < ${d30})::int AS "newPrev30",
        count(*) FILTER (WHERE u."onboardingComplete")::int AS onboarded,
        count(*) FILTER (WHERE u."emergencyConsentAt" IS NOT NULL)::int AS consented,
        count(*) FILTER (WHERE EXISTS (SELECT 1 FROM "PushSubscription" ps WHERE ps."userId" = u.id))::int AS "withAlerts",
        count(*) FILTER (WHERE u."onboardingComplete" AND u."isEligible")::int AS eligible,
        count(*) FILTER (WHERE u."onboardingComplete" AND u."isAvailable")::int AS available,
        count(*) FILTER (WHERE u.phone IS NOT NULL)::int AS "withPhone",
        count(*) FILTER (WHERE NOT u."onboardingComplete" AND u."createdAt" < ${d2})::int AS stalled
      FROM "User" u
      WHERE u."hospitalId" IS NULL`,
    prisma.podInvite.groupBy({ by: ["senderId"] }).then((g) => g.length),
    prisma.pod.count(),
    prisma.hospital.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.bloodRequest.count({ where: { status: "OPEN" } }),
    prisma.contract.aggregate({ where: { status: "ACTIVE" }, _sum: { monthlyPesewas: true }, _count: { _all: true } }),
    prisma.hospital.findFirst({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
    prisma.ledgerEntry.count({ where: { type: "INCOME", status: "PENDING", date: { lt: daysAgo(14) } } }),
  ]);

  const { donors, new7, newPrev7, new30, newPrev30, onboarded, consented, withAlerts, eligible, available, withPhone, stalled } =
    countRows[0];

  const hospitals = { PENDING: 0, APPROVED: 0, REJECTED: 0 } as Record<string, number>;
  for (const g of hospitalGroups) hospitals[g.status] = g._count._all;

  const funnel = [
    { key: "signed", label: "Signed up", value: donors },
    { key: "onboarded", label: "Finished onboarding", value: onboarded },
    { key: "consent", label: "Agreed to emergency alerts", value: consented },
    { key: "alerts", label: "Turned on phone alerts", value: withAlerts },
    { key: "inviter", label: "Invited someone", value: inviters },
  ].map((step, i, all) => ({
    ...step,
    ofFirst: pct(step.value, all[0].value),
    ofPrev: i === 0 ? 100 : pct(step.value, all[i - 1].value),
  }));

  // Things that need the founder's attention, most urgent first.
  const attention: { id: string; tone: "red" | "amber" | "blue"; title: string; detail: string; href: string }[] = [];

  if (hospitals.PENDING > 0) {
    const waitDays = oldestPending ? Math.floor((Date.now() - oldestPending.createdAt.getTime()) / DAY) : 0;
    attention.push({
      id: "hospitals",
      tone: waitDays >= 3 ? "red" : "amber",
      title: `${hospitals.PENDING} hospital application${hospitals.PENDING === 1 ? "" : "s"} waiting`,
      detail: waitDays >= 1 ? `The oldest has waited ${waitDays} day${waitDays === 1 ? "" : "s"}.` : "Applied today.",
      href: "/admin/hospitals?status=PENDING",
    });
  }
  if (openEmergencies > 0) {
    attention.push({
      id: "emergencies",
      tone: "red",
      title: `${openEmergencies} open blood request${openEmergencies === 1 ? "" : "s"}`,
      detail: "Someone is waiting on an answer.",
      href: "/admin/emergencies",
    });
  }
  if (overdue > 0) {
    attention.push({
      id: "overdue",
      tone: "amber",
      title: `${overdue} unpaid invoice${overdue === 1 ? "" : "s"} over 14 days old`,
      detail: "Follow up with the hospital.",
      href: "/admin/finance",
    });
  }
  if (stalled > 0) {
    attention.push({
      id: "stalled",
      tone: "blue",
      title: `${stalled} sign-up${stalled === 1 ? "" : "s"} stuck in onboarding`,
      detail: "Created over 2 days ago and never finished.",
      href: "/admin/users?status=stalled",
    });
  }
  if (donors >= 5 && pct(withAlerts, donors) < 50) {
    attention.push({
      id: "alerts",
      tone: "blue",
      title: `Only ${pct(withAlerts, donors)}% of donors have alerts on`,
      detail: "Without alerts, people only find out about an emergency if they open the app.",
      href: "/admin/users?status=alertsOff",
    });
  }

  return {
    donors,
    new7,
    newPrev7,
    new30,
    newPrev30,
    onboarded,
    withPhone,
    withAlerts,
    eligible,
    available,
    pods,
    hospitals,
    openEmergencies,
    mrrPesewas: mrr._sum.monthlyPesewas ?? 0,
    activeContracts: mrr._count._all,
    funnel,
    attention,
  };
}

// ----------------------------------------------------------------- pods

type PodRow = { id: string; size: number; ready: number };

async function getPodRows(): Promise<PodRow[]> {
  // Size counts the owner plus members; "ready" counts those who can donate now.
  return prisma.$queryRaw<PodRow[]>`
    SELECT p.id,
           (1 + COUNT(pm.id))::int AS size,
           ((CASE WHEN o."isEligible" THEN 1 ELSE 0 END) +
             COALESCE(SUM(CASE WHEN u."isEligible" THEN 1 ELSE 0 END), 0))::int AS ready
    FROM "Pod" p
    JOIN "User" o ON o.id = p."ownerId"
    LEFT JOIN "PodMember" pm ON pm."podId" = p.id
    LEFT JOIN "User" u ON u.id = pm."userId"
    GROUP BY p.id, o."isEligible"`;
}

const SIZE_BUCKETS = [
  { label: "Just the owner", test: (n: number) => n === 1 },
  { label: "2 to 4", test: (n: number) => n >= 2 && n <= 4 },
  { label: "5 to 9", test: (n: number) => n >= 5 && n <= 9 },
  { label: "10 to 14", test: (n: number) => n >= 10 && n <= 14 },
  { label: "15 to 19", test: (n: number) => n >= 15 && n <= 19 },
  { label: "20 or more", test: (n: number) => n >= 20 },
];

/**
 * How invitations are doing. The durable share link and code of each Pod is a door, not an invitation
 * that gets "accepted", so it is not counted as waiting. Instead:
 *  - joined: people who came into a Pod through any invite (link, code or email). Counted from the
 *    membership itself, so it is right however they joined.
 *  - pending / expired: invitations sent to one person by email that have not been answered.
 */
async function inviteCounts() {
  const now = new Date();
  const [joined, pending, expired] = await Promise.all([
    prisma.podMember.count({ where: { invitedById: { not: null } } }),
    prisma.podInvite.count({ where: { kind: "DIRECT", status: "PENDING", expiresAt: { gt: now } } }),
    prisma.podInvite.count({
      where: { kind: "DIRECT", OR: [{ status: "EXPIRED" }, { status: "PENDING", expiresAt: { lte: now } }] },
    }),
  ]);
  return { sent: joined + pending + expired, accepted: joined, pending, expired };
}

export async function getNetwork() {
  const [podRows, bloodGroups, cityGroups, inviteGroups, joinRows, topPods] = await Promise.all([
    getPodRows(),
    prisma.user.groupBy({
      by: ["bloodType", "isEligible"],
      where: { ...DONORS, onboardingComplete: true, bloodType: { not: null } },
      _count: { _all: true },
    }),
    // "Ho", "HO" and "ho " are one place, so group on a tidied-up spelling rather than the raw text.
    prisma.$queryRaw<{ city: string; n: number }[]>`
      SELECT initcap(lower(btrim("city"))) AS city, count(*)::int AS n
      FROM "User"
      WHERE "onboardingComplete" = true AND "hospitalId" IS NULL AND btrim(coalesce("city", '')) <> ''
      GROUP BY initcap(lower(btrim("city")))
      ORDER BY n DESC, city
      LIMIT 8`,
    inviteCounts(),
    prisma.$queryRaw<{ week: string; n: number }[]>`
      SELECT to_char(date_trunc('week', "joinedAt"), 'YYYY-MM-DD') AS week, count(*)::int AS n
      FROM "PodMember" WHERE "joinedAt" >= ${daysAgo(84)}
      GROUP BY 1 ORDER BY 1`,
    prisma.pod.findMany({
      orderBy: { members: { _count: "desc" } },
      take: 8,
      select: { id: true, name: true, createdAt: true, owner: { select: { name: true } }, _count: { select: { members: true } } },
    }),
  ]);

  const totalPods = podRows.length;
  const totalPeople = podRows.reduce((sum, r) => sum + r.size, 0);
  const readyPods = podRows.filter((r) => r.ready >= POD_READY_THRESHOLD).length;

  const sizeDistribution = SIZE_BUCKETS.map((b) => ({
    label: b.label,
    value: podRows.filter((r) => b.test(r.size)).length,
  }));

  // Blood type coverage across the whole network, split by who can donate now.
  const bloodTypes = (Object.keys(BLOOD_TYPE_LABELS) as BloodType[]).map((type) => {
    const rows = bloodGroups.filter((g) => g.bloodType === type);
    const total = rows.reduce((s, r) => s + r._count._all, 0);
    const eligible = rows.find((r) => r.isEligible)?._count._all ?? 0;
    return { type, label: BLOOD_TYPE_LABELS[type], total, eligible };
  });

  const invites = inviteGroups;

  const weeklyJoins: SeriesPoint[] = joinRows.map((r) => ({
    date: r.week,
    label: new Date(r.week).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    value: r.n,
  }));

  return {
    totalPods,
    totalPeople,
    avgSize: totalPods ? Math.round((totalPeople / totalPods) * 10) / 10 : 0,
    readyPods,
    ownerOnlyPods: podRows.filter((r) => r.size === 1).length,
    sizeDistribution,
    bloodTypes,
    cities: cityGroups.map((c) => ({ city: c.city, value: c.n })),
    invites,
    weeklyJoins,
    topPods: topPods.map((p) => ({
      id: p.id,
      name: p.name,
      owner: p.owner.name ?? "Unknown",
      size: p._count.members + 1,
      createdAt: p.createdAt,
    })),
  };
}

// ---------------------------------------------------------------- users

export const USER_PAGE_SIZE = 25;

export type UserFilters = {
  q?: string;
  blood?: string;
  status?: string;
  page?: number;
};

function userWhere(f: UserFilters): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = { ...DONORS };
  const and: Prisma.UserWhereInput[] = [];

  if (f.q) {
    and.push({
      OR: [
        { name: { contains: f.q, mode: "insensitive" } },
        { email: { contains: f.q, mode: "insensitive" } },
        { phone: { contains: f.q } },
        { city: { contains: f.q, mode: "insensitive" } },
      ],
    });
  }
  if (f.blood && f.blood in BLOOD_TYPE_LABELS) where.bloodType = f.blood as BloodType;

  switch (f.status) {
    case "active":
      where.onboardingComplete = true;
      break;
    case "stalled":
      where.onboardingComplete = false;
      break;
    case "eligible":
      where.onboardingComplete = true;
      where.isEligible = true;
      break;
    case "resting":
      where.isEligible = false;
      break;
    case "alertsOff":
      where.onboardingComplete = true;
      where.pushSubscriptions = { none: {} };
      break;
  }

  if (and.length) where.AND = and;
  return where;
}

const userListSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  city: true,
  bloodType: true,
  isEligible: true,
  isAvailable: true,
  onboardingComplete: true,
  createdAt: true,
  _count: { select: { podMemberships: true, ownedPods: true, donations: true, pushSubscriptions: true } },
} satisfies Prisma.UserSelect;

export async function getUsers(filters: UserFilters) {
  const where = userWhere(filters);
  const page = Math.max(1, filters.page ?? 1);

  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * USER_PAGE_SIZE,
      take: USER_PAGE_SIZE,
      select: userListSelect,
    }),
  ]);

  return { total, page, pages: Math.max(1, Math.ceil(total / USER_PAGE_SIZE)), rows };
}

/** Every matching user, for CSV export. Capped so one click cannot pull an unbounded table. */
export async function getUsersForExport(filters: UserFilters) {
  return prisma.user.findMany({
    where: userWhere(filters),
    orderBy: { createdAt: "desc" },
    take: 5000,
    select: userListSelect,
  });
}

export async function getUserDetail(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      ownedPods: { select: { id: true, name: true, createdAt: true, _count: { select: { members: true } } } },
      podMemberships: { select: { joinedAt: true, pod: { select: { id: true, name: true, owner: { select: { name: true } } } } } },
      donations: { orderBy: { donatedAt: "desc" }, take: 10 },
      pushSubscriptions: { select: { id: true, userAgent: true, createdAt: true }, orderBy: { createdAt: "desc" } },
      hospital: { select: { id: true, name: true, status: true } },
      _count: { select: { sentInvites: true, donations: true } },
    },
  });
}

// ------------------------------------------------------------- hospitals

export async function getHospitals(status?: string) {
  const where: Prisma.HospitalWhereInput = {};
  if (status === "PENDING" || status === "APPROVED" || status === "REJECTED") where.status = status;

  const [rows, counts] = await Promise.all([
    prisma.hospital.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: {
        staff: { select: { name: true, email: true, jobTitle: true } },
        contracts: { where: { status: "ACTIVE" }, select: { monthlyPesewas: true } },
      },
    }),
    prisma.hospital.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const tally = { ALL: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 } as Record<string, number>;
  for (const c of counts) {
    tally[c.status] = c._count._all;
    tally.ALL += c._count._all;
  }
  return { rows, tally };
}

// ------------------------------------------------------------ emergencies

export async function getEmergencies() {
  const [rows, byStatus, byType] = await Promise.all([
    prisma.bloodRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        bloodType: true,
        urgency: true,
        facility: true,
        location: true,
        status: true,
        createdAt: true,
        requester: { select: { id: true, name: true } },
      },
    }),
    prisma.bloodRequest.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.bloodRequest.groupBy({ by: ["bloodType"], _count: { _all: true }, orderBy: { _count: { bloodType: "desc" } } }),
  ]);

  const status = { OPEN: 0, MATCHED: 0, FULFILLED: 0, CANCELLED: 0 } as Record<string, number>;
  for (const g of byStatus) status[g.status] = g._count._all;

  return {
    rows,
    status,
    total: Object.values(status).reduce((a, b) => a + b, 0),
    byType: byType.map((g) => ({ label: BLOOD_TYPE_LABELS[g.bloodType], value: g._count._all })),
  };
}

// ------------------------------------------------------------- helpers

export async function getPodSummary() {
  const rows = await getPodRows();
  return {
    total: rows.length,
    ready: rows.filter((r) => r.ready >= POD_READY_THRESHOLD).length,
    ownerOnly: rows.filter((r) => r.size === 1).length,
  };
}

export function getRecentSignups(take = 6) {
  return prisma.user.findMany({
    where: DONORS,
    orderBy: { createdAt: "desc" },
    take,
    select: { id: true, name: true, city: true, bloodType: true, onboardingComplete: true, createdAt: true },
  });
}

export async function getAdminBadges() {
  const [hospitals, emergencies] = await Promise.all([
    prisma.hospital.count({ where: { status: "PENDING" } }),
    prisma.bloodRequest.count({ where: { status: "OPEN" } }),
  ]);
  return { hospitals, emergencies };
}
