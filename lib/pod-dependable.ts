import { BloodType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canDonateTo } from "@/lib/blood-compatibility";
import { BLOOD_TYPE_LABELS } from "@/lib/blood-type";

/**
 * "Dependable": how much a Pod can be relied on, from 0 to 100.
 *
 * Everything here is worked out from real member data. Nothing is estimated or made up.
 * Track record only counts once someone in the Pod has donated; until then that part is
 * left out (and the other parts share its weight) rather than scored as zero.
 */

export const DEPENDABLE_WEIGHTS = {
  ready: 0.45,
  coverage: 0.2,
  size: 0.15,
  track: 0.2,
} as const;

/** Ready people at which the "ready" part is full. Matches the "Pod ready" rule used in the app. */
const READY_TARGET = 3;
/** Members at which blood-type coverage counts in full. */
const COVERAGE_FULL_AT = 3;
/** Members at which the size part is full. */
const SIZE_TARGET = 10;
/** Credit for a donation the person logged but nobody has verified. */
const UNVERIFIED_CREDIT = 0.6;

export interface DependablePerson {
  bloodType: BloodType | null;
  isEligible: boolean;
  isAvailable: boolean;
  hasLocation: boolean;
  hasConsent: boolean;
  verifiedDonations: number;
  totalDonations: number;
}

export interface DependablePart {
  id: "ready" | "coverage" | "size" | "track";
  label: string;
  /** 0–100, or null while there's nothing to measure yet. */
  value: number | null;
  /** Plain-language detail, e.g. "3 of 5 ready". */
  detail: string;
}

export interface DependableResult {
  score: number;
  label: string;
  parts: DependablePart[];
  /** True while some parts have no data yet. */
  building: boolean;
  /** One concrete thing that would raise the score. Owners only see this. */
  tip: string | null;
}

function isReady(p: DependablePerson) {
  return Boolean(p.bloodType) && p.isEligible && p.isAvailable && p.hasLocation && p.hasConsent;
}

function labelFor(score: number) {
  if (score >= 85) return "Very dependable";
  if (score >= 70) return "Dependable";
  if (score >= 40) return "Taking shape";
  return "Starting out";
}

function measure(people: DependablePerson[]) {
  const n = people.length;
  const readyCount = people.filter(isReady).length;
  // Measured against a target, not as a share of the Pod: one ready person out of one is not a
  // dependable network, so a tiny Pod can't score full marks here.
  const ready = Math.min(readyCount / READY_TARGET, 1);

  // A recipient type is covered when someone in the Pod could give to it. A lone universal donor
  // technically covers every type, so coverage only counts fully once the Pod has a few people.
  const donorTypes = people.filter((p) => p.bloodType && p.isEligible).map((p) => p.bloodType as BloodType);
  const all = Object.values(BloodType);
  const coveredCount = all.filter((r) => donorTypes.some((d) => canDonateTo(d, r))).length;
  const coverage = (coveredCount / all.length) * Math.min(n / COVERAGE_FULL_AT, 1);

  const size = Math.sqrt(Math.min(n, SIZE_TARGET) / SIZE_TARGET);

  const anyDonation = people.some((p) => p.totalDonations > 0);
  const track = anyDonation
    ? people.reduce((sum, p) => {
        if (p.verifiedDonations > 0) return sum + 1;
        if (p.totalDonations > 0) return sum + UNVERIFIED_CREDIT;
        return sum;
      }, 0) / n
    : null;

  const w = DEPENDABLE_WEIGHTS;
  let total = ready * w.ready + coverage * w.coverage + size * w.size;
  let weight = w.ready + w.coverage + w.size;
  if (track !== null) {
    total += track * w.track;
    weight += w.track;
  }
  const score = Math.round((total / weight) * 100);

  return { n, readyCount, ready, coveredCount, coverage, size, track, score };
}

/** Which setup step the not-ready members are most often missing. */
function commonGap(people: DependablePerson[]) {
  const notReady = people.filter((p) => !isReady(p));
  const counts = {
    availability: notReady.filter((p) => p.bloodType && p.isEligible && !p.isAvailable).length,
    bloodType: notReady.filter((p) => !p.bloodType).length,
    consent: notReady.filter((p) => !p.hasConsent).length,
    location: notReady.filter((p) => !p.hasLocation).length,
    resting: notReady.filter((p) => !p.isEligible).length,
  };
  return { notReady: notReady.length, counts };
}

function buildTip(people: DependablePerson[], base: number): string | null {
  const n = people.length;
  const options: { gain: number; text: string }[] = [];

  const { notReady, counts } = commonGap(people);
  if (notReady > 0) {
    // Simulate one not-ready person finishing setup.
    const idx = people.findIndex((p) => !isReady(p) && p.isEligible);
    if (idx >= 0) {
      const next = people.map((p, i) =>
        i === idx ? { ...p, bloodType: p.bloodType ?? BloodType.O_POS, isAvailable: true, hasLocation: true, hasConsent: true } : p,
      );
      const gain = measure(next).score - base;
      const top = Object.entries(counts)
        .filter(([k]) => k !== "resting")
        .sort((a, b) => b[1] - a[1])[0];
      const why =
        top && top[1] > 0
          ? {
              availability: `${top[1]} haven't turned on availability`,
              bloodType: `${top[1]} haven't added a blood type`,
              consent: `${top[1]} haven't given emergency consent`,
              location: `${top[1]} haven't set a location`,
            }[top[0] as "availability" | "bloodType" | "consent" | "location"]
          : `${notReady} haven't finished setup`;
      options.push({ gain, text: `${why}. Each one who does lifts the score by about ${Math.max(gain, 1)}.` });
    }
  }

  if (n < 20) {
    const all = Object.values(BloodType);
    const have = people.filter((p) => p.bloodType && p.isEligible).map((p) => p.bloodType as BloodType);
    let best: { type: BloodType; gain: number } | null = null;
    for (const t of all) {
      const covered = all.filter((r) => [...have, t].some((d) => canDonateTo(d, r))).length;
      const current = all.filter((r) => have.some((d) => canDonateTo(d, r))).length;
      if (covered > current && (!best || covered - current > best.gain)) best = { type: t, gain: covered - current };
    }
    const ready = { bloodType: best?.type ?? BloodType.O_POS, isEligible: true, isAvailable: true, hasLocation: true, hasConsent: true, verifiedDonations: 0, totalDonations: 0 };
    const gain = measure([...people, ready]).score - base;
    if (best) {
      options.push({
        gain,
        text: `Adding a ${BLOOD_TYPE_LABELS[best.type]} donor would cover ${best.gain} more blood type${best.gain === 1 ? "" : "s"}, worth about +${Math.max(gain, 1)}.`,
      });
    } else if (n < SIZE_TARGET) {
      options.push({ gain, text: `Each ready person you add lifts the score by about ${Math.max(gain, 1)}.` });
    }
  }

  const best = options.filter((o) => o.gain > 0).sort((a, b) => b.gain - a.gain)[0];
  return best ? best.text : null;
}

export function computeDependable(people: DependablePerson[]): DependableResult {
  const m = measure(people);
  const base = m.score;

  const parts: DependablePart[] = [
    {
      id: "ready",
      label: "Ready members",
      value: Math.round(m.ready * 100),
      detail:
        m.readyCount >= READY_TARGET
          ? `${m.readyCount} ready to respond`
          : `${m.readyCount} of ${READY_TARGET} ready people`,
    },
    {
      id: "coverage",
      label: "Blood-type coverage",
      value: Math.round(m.coverage * 100),
      detail:
        m.n < COVERAGE_FULL_AT
          ? `${m.coveredCount} of 8 types, counts fully from ${COVERAGE_FULL_AT} people`
          : `${m.coveredCount} of 8 types can be supplied`,
    },
    {
      id: "size",
      label: "Size",
      value: Math.round(m.size * 100),
      detail: `${m.n} of ${SIZE_TARGET} people`,
    },
    {
      id: "track",
      label: "Track record",
      value: m.track === null ? null : Math.round(m.track * 100),
      detail: m.track === null ? "Building: grows with donations" : "From logged and verified donations",
    },
  ];

  return {
    score: base,
    label: labelFor(base),
    parts,
    building: m.track === null,
    tip: buildTip(people, base),
  };
}

/** Dependable score for several Pods in one query. */
export async function getDependableForPods(podIds: string[]): Promise<Map<string, DependableResult>> {
  const out = new Map<string, DependableResult>();
  if (podIds.length === 0) return out;

  const userSelect = {
    bloodType: true,
    isEligible: true,
    isAvailable: true,
    city: true,
    latitude: true,
    emergencyConsentAt: true,
    donations: { select: { verified: true } },
  } as const;

  const pods = await prisma.pod.findMany({
    where: { id: { in: podIds } },
    select: {
      id: true,
      owner: { select: userSelect },
      members: { select: { user: { select: userSelect } } },
    },
  });

  for (const pod of pods) {
    const people = [pod.owner, ...pod.members.map((m) => m.user)].map<DependablePerson>((u) => ({
      bloodType: u.bloodType,
      isEligible: u.isEligible,
      isAvailable: u.isAvailable,
      hasLocation: Boolean(u.city) || u.latitude !== null,
      hasConsent: u.emergencyConsentAt !== null,
      verifiedDonations: u.donations.filter((d) => d.verified).length,
      totalDonations: u.donations.length,
    }));
    out.set(pod.id, computeDependable(people));
  }
  return out;
}
