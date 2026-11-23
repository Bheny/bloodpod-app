import type { TermId } from "@/lib/glossary";

/**
 * The Get started checklist. A step is done because the person has actually done the thing, read from the
 * data, never because they said so. The only exceptions are a step they chose to skip, and Discover, where
 * "opened it and decided" is the whole step (staying unlisted is a fine answer).
 */
export type StepId = "blood" | "alerts" | "invite" | "drill" | "discover" | "contact" | "donation";

export interface StepDef {
  id: StepId;
  title: string;
  /** One or two plain sentences on why it matters. */
  why: string;
  cta: string;
  href: string;
  /** Turns on alerts in place instead of linking somewhere. */
  push?: boolean;
  /** Opening the step counts as doing it. */
  markSeenOnOpen?: boolean;
  tip?: TermId;
}

/** People to invite (besides you) before the invite step counts. */
export const INVITE_TARGET = 3;

export const STEPS: StepDef[] = [
  {
    id: "blood",
    title: "Confirm your blood type",
    why: "Hospitals and your Pod match on it. It decides who you can help.",
    cta: "Add blood type",
    href: "/profile/edit",
  },
  {
    id: "alerts",
    title: "Turn on emergency alerts",
    why: "This is how you hear first when someone near you needs your blood type. You answer yes or no.",
    cta: "Turn on alerts",
    href: "/profile/notifications",
    push: true,
    tip: "alerts",
  },
  {
    id: "invite",
    title: `Invite ${INVITE_TARGET} people you trust`,
    why: "A Pod only works with people in it. Your church, office, school or family: share a link or show the QR code.",
    cta: "Invite people",
    href: "/pod/invite",
    tip: "pod",
  },
  {
    id: "drill",
    title: "Run a practice drill",
    why: "Send a clearly marked practice alert to your Pod and see who would answer. It is never a real emergency.",
    cta: "Open Pod readiness",
    href: "/pod/ready",
    tip: "drill",
  },
  {
    id: "discover",
    title: "Choose how you appear in Discover",
    why: "Everyone can be found without a name. Decide whether to show your first name so people can ask you for help.",
    cta: "Open Discover",
    href: "/discover",
    markSeenOnOpen: true,
    tip: "discover",
  },
  {
    id: "contact",
    title: "Add an emergency contact",
    why: "Someone to call if something happens to you. It goes on your Medical ID.",
    cta: "Add a contact",
    href: "/medical-history",
    tip: "medicalId",
  },
  {
    id: "donation",
    title: "Log a donation",
    why: "Your donation record builds your Blood Card and tells us when you can give again. Skip this if you have never donated.",
    cta: "Log a donation",
    href: "/passport/log",
    tip: "bloodCard",
  },
];

export interface Facts {
  hasBloodType: boolean;
  hasPush: boolean;
  /** Different people in the Pods you own, not counting you. */
  invitedCount: number;
  drillsRun: number;
  isPublic: boolean;
  hasEmergencyContact: boolean;
  donationCount: number;
}

export interface StepState extends StepDef {
  done: boolean;
  /** Done only because they chose to skip it (or opened it, for Discover). */
  skipped: boolean;
}

const STEP_IDS = new Set<string>(STEPS.map((s) => s.id));
export const isStepId = (id: string): id is StepId => STEP_IDS.has(id);

function seenByData(id: StepId, f: Facts): boolean {
  switch (id) {
    case "blood":
      return f.hasBloodType;
    case "alerts":
      return f.hasPush;
    case "invite":
      return f.invitedCount >= INVITE_TARGET;
    case "drill":
      return f.drillsRun > 0;
    case "discover":
      return f.isPublic;
    case "contact":
      return f.hasEmergencyContact;
    case "donation":
      return f.donationCount > 0;
  }
}

export function computeSteps(facts: Facts, seen: readonly string[]): StepState[] {
  return STEPS.map((s) => {
    const byData = seenByData(s.id, facts);
    const chosen = seen.includes(s.id);
    return { ...s, done: byData || chosen, skipped: !byData && chosen };
  });
}

export interface Progress {
  done: number;
  total: number;
  allDone: boolean;
  /** The first step still to do. */
  next: StepState | null;
}

export function progressOf(steps: StepState[]): Progress {
  const done = steps.filter((s) => s.done).length;
  return { done, total: steps.length, allDone: done === steps.length, next: steps.find((s) => !s.done) ?? null };
}
