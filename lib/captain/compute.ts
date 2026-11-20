import { CAPTAIN, CHILDREN_REQUIRED, LEVEL_TITLES, MAX_LEVEL, titleFor } from "@/lib/captain-config";
import type { CaptainResult, ChecklistItem, ChildState, TreeMember, TreePod } from "@/lib/captain/types";

/**
 * The Captain rules, as pure functions of a Pod tree. No database, no clock except the `now` you pass,
 * so every boundary can be tested exactly. loadTree() is the only thing that reads the database.
 *
 * Nothing in here, or anywhere in the alert code, may change who is alerted or in what order: a
 * Captain's level is recognition only. A test enforces that.
 */

const DAY = 86_400_000;

/** Same person even if they signed up twice with the same number written differently. */
export function phoneKey(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.length >= 9 ? digits.slice(-9) : null;
}

const counts = (m: TreeMember) => m.phoneVerified && m.eligible;

/** Everyone who counts in one Pod: verified, eligible, once each by account and by phone number. */
export function countedMembers(pod: Pick<TreePod, "members">): TreeMember[] {
  const seenIds = new Set<string>();
  const seenPhones = new Set<string>();
  const out: TreeMember[] = [];
  for (const m of pod.members) {
    if (!counts(m) || seenIds.has(m.userId)) continue;
    const pk = phoneKey(m.phone);
    if (pk && seenPhones.has(pk)) continue;
    seenIds.add(m.userId);
    if (pk) seenPhones.add(pk);
    out.push(m);
  }
  return out;
}

function everyPod(root: TreePod): TreePod[] {
  return [root, ...root.children.flatMap(everyPod)];
}

/** Unique, phone-verified, eligible donors across a whole tree, each counted once however many Pods they are in. */
export function uniqueDonorCount(root: TreePod): number {
  const ids = new Set<string>();
  const phones = new Set<string>();
  for (const pod of everyPod(root)) {
    for (const m of countedMembers(pod)) {
      const pk = phoneKey(m.phone);
      if (ids.has(m.userId) || (pk && phones.has(pk))) continue;
      ids.add(m.userId);
      if (pk) phones.add(pk);
    }
  }
  return ids.size;
}

/** Passed when a drill had enough eligible people and at least the pass rate answered in time. */
export function drillPassed(pod: TreePod): boolean {
  return pod.drills.some(
    (d) => d.eligibleCount >= CAPTAIN.drillMinEligible && d.respondedInWindow / d.eligibleCount >= CAPTAIN.drillPassRate,
  );
}

function isRecent(date: Date | null, now: Date) {
  return !!date && now.getTime() - date.getTime() <= CAPTAIN.activityWindowDays * DAY;
}

/**
 * Which child Pods are working. A person can help one sibling qualify, not several, so the same three
 * friends cannot make three Pods. A child's leader is always counted in their own Pod.
 */
export function childStates(parent: TreePod, now: Date): ChildState[] {
  const claimed = new Set<string>();
  const ordered = [...parent.children].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id));
  const parentPhone = phoneKey(parent.leaderPhone);

  return ordered.map((child): ChildState => {
    const level = computeCaptainLevel(child, now).level;
    const childPhone = phoneKey(child.leaderPhone);
    if (child.leaderId === parent.leaderId || (parentPhone && childPhone === parentPhone)) {
      return { podId: child.id, qualifying: false, reason: "same_person", level };
    }

    const counted = countedMembers(child).filter((m) => m.userId === child.leaderId || !claimed.has(m.userId));
    const leaderCounted = counted.some((m) => m.userId === child.leaderId);
    if (!child.leaderPhoneVerified || !leaderCounted || counted.length < CAPTAIN.childMinMembers) {
      return { podId: child.id, qualifying: false, reason: "needs_members", level };
    }
    if (!isRecent(child.lastResponseAt, now)) {
      return { podId: child.id, qualifying: false, reason: "needs_activity", level };
    }

    for (const m of counted) if (m.userId !== child.leaderId) claimed.add(m.userId);
    return { podId: child.id, qualifying: true, reason: "ok", level };
  });
}

/** Does this Pod meet the requirement for level k? */
function meets(k: number, passed: boolean, children: ChildState[]): boolean {
  if (!passed) return false;
  const need = CHILDREN_REQUIRED[k];
  if (k <= 1) return children.filter((c) => c.qualifying).length >= need;
  return children.filter((c) => c.qualifying && c.level !== null && c.level >= k - 2).length >= need;
}

export function computeCaptainLevel(pod: TreePod, now: Date = new Date()): CaptainResult {
  const passed = drillPassed(pod);
  const children = childStates(pod, now);
  const qualifying = children.filter((c) => c.qualifying).length;

  let level: number | null = null;
  for (let k = MAX_LEVEL; k >= 0; k--) {
    if (meets(k, passed, children)) {
      level = k;
      break;
    }
  }

  const next = level === null ? 0 : level < MAX_LEVEL ? level + 1 : null;
  return {
    level,
    title: titleFor(level),
    drillPassed: passed,
    qualifyingChildren: qualifying,
    children,
    checklist: next === null ? [] : checklistFor(pod, next, passed, children),
    nextLevel: next,
    nextTitle: next === null ? null : LEVEL_TITLES[next],
  };
}

function checklistFor(pod: TreePod, next: number, passed: boolean, children: ChildState[]): ChecklistItem[] {
  const eligible = countedMembers(pod).length;
  const need = CHILDREN_REQUIRED[next];
  const have =
    next <= 1
      ? children.filter((c) => c.qualifying).length
      : children.filter((c) => c.qualifying && c.level !== null && c.level >= next - 2).length;

  const items: ChecklistItem[] = [];

  if (!passed && eligible < CAPTAIN.drillMinEligible) {
    items.push({
      key: "people",
      label: `Have ${CAPTAIN.drillMinEligible} verified, eligible people in your Pod`,
      done: false,
      detail: `${eligible} of ${CAPTAIN.drillMinEligible}`,
      action: "invite",
    });
  }
  items.push({
    key: "drill",
    label: "Pass a drill",
    done: passed,
    detail: passed ? undefined : `${Math.round(CAPTAIN.drillPassRate * 100)}% answering in ${CAPTAIN.drillWindowMinutes} minutes`,
    action: passed ? undefined : eligible < CAPTAIN.drillMinEligible ? "wait" : "drill",
  });
  items.push({
    key: "children",
    label:
      next <= 1
        ? need === 1
          ? "Help one person start a working Pod"
          : `Help ${need} people start working Pods`
        : `${need} Pods led by a ${LEVEL_TITLES[next - 2]} or higher`,
    done: have >= need,
    detail: `${Math.min(have, need)} of ${need}`,
    action: have >= need ? undefined : next <= 1 ? "spinoff" : "wait",
  });
  return items;
}
