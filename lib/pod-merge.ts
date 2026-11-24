import type { PodCategoryId } from "./pod-categories";

/**
 * Merging a donor's several Pods into one. Pure planning, no database: it takes what is in the Pods and says
 * what should move, what is a duplicate, and what category each person ends up with. The script
 * (scripts/merge-pods.ts) reads the database, calls this, prints the plan, and only changes anything when
 * asked to apply it.
 */

export interface MergePodIn {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
  slotLimit: number;
  members: { id: string; userId: string; category: PodCategoryId }[];
}

export interface OwnerPlan {
  ownerId: string;
  survivorId: string;
  survivorName: string;
  /** Pods that are emptied into the survivor and then removed. */
  removed: { id: string; name: string; guess: PodCategoryId }[];
  /** Members who move into the survivor, with the category they end up with. */
  moves: { memberId: string; userId: string; fromPodId: string; category: PodCategoryId }[];
  /** Member rows that are deleted because the person is already in the survivor (or is the owner). */
  duplicates: { memberId: string; userId: string; fromPodId: string }[];
  /** Survivor rows whose category is improved from OTHER. */
  recategorised: { memberId: string; category: PodCategoryId }[];
  /** The slot limit the survivor needs, or null when it already fits. */
  newSlotLimit: number | null;
  /** People in the survivor afterwards, owner included. */
  peopleAfter: number;
}

const WORDS: [PodCategoryId, RegExp][] = [
  ["FAMILY", /\b(famil(y|ies)|fam|relatives?|kin|cousins?|siblings?)\b/i],
  ["CHURCH", /\b(church|chapel|parish|fellowship|congregation|ministry|choir|mosque|cathedral)\b/i],
  ["SCHOOL", /\b(school|class(mates?)?|alumni|universit(y|ies)|college|campus|course|year\s*group)\b/i],
  ["WORK", /\b(work|office|team|colleagues?|company|staff|job|business|workplace)\b/i],
  ["NEIGHBOURS", /\b(neighbou?rs?|neighbou?rhood|estate|street|community|compound|area)\b/i],
  ["FRIENDS", /\b(friends?|squad|crew|buddies|pals?|gang)\b/i],
];

/** A starting category from a Pod's name, when the name clearly says so. Otherwise Other. */
export function guessCategory(podName: string): PodCategoryId {
  for (const [category, re] of WORDS) if (re.test(podName)) return category;
  return "OTHER";
}

const slotsFor = (people: number) => Math.ceil(people / 10) * 10;

/** The survivor is the Pod with the most members; a tie goes to the oldest, then the lowest id. */
export function pickSurvivor(pods: MergePodIn[]): MergePodIn {
  return [...pods].sort(
    (a, b) => b.members.length - a.members.length || a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id),
  )[0];
}

/** The plan for one owner who has more than one Pod. */
export function planOwnerMerge(pods: MergePodIn[]): OwnerPlan {
  const survivor = pickSurvivor(pods);
  const survivorGuess = guessCategory(survivor.name);

  // Where each person is in the survivor now, and the category their row will end with.
  const final = new Map<string, { memberId: string; category: PodCategoryId }>();
  for (const m of survivor.members) final.set(m.userId, { memberId: m.id, category: m.category });

  const recategorisedIds = new Set<string>();
  const upgrade = (userId: string, to: PodCategoryId) => {
    const row = final.get(userId);
    if (row && row.category === "OTHER" && to !== "OTHER") {
      row.category = to;
      recategorisedIds.add(row.memberId);
    }
  };
  // The survivor's own people take the survivor's name as a hint, where nobody sorted them yet.
  for (const m of survivor.members) upgrade(m.userId, survivorGuess);

  const removedPods = pods
    .filter((p) => p.id !== survivor.id)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id));

  const moves: OwnerPlan["moves"] = [];
  const duplicates: OwnerPlan["duplicates"] = [];

  for (const pod of removedPods) {
    const guess = guessCategory(pod.name);
    for (const m of pod.members) {
      const category = m.category !== "OTHER" ? m.category : guess; // a category the owner already set wins
      if (m.userId === survivor.ownerId || final.has(m.userId)) {
        duplicates.push({ memberId: m.id, userId: m.userId, fromPodId: pod.id });
        if (m.userId !== survivor.ownerId) upgrade(m.userId, category);
        continue;
      }
      final.set(m.userId, { memberId: m.id, category });
      moves.push({ memberId: m.id, userId: m.userId, fromPodId: pod.id, category });
    }
  }

  const peopleAfter = 1 + final.size; // the owner is not a member row
  return {
    ownerId: survivor.ownerId,
    survivorId: survivor.id,
    survivorName: survivor.name,
    removed: removedPods.map((p) => ({ id: p.id, name: p.name, guess: guessCategory(p.name) })),
    moves,
    duplicates,
    recategorised: [...recategorisedIds].map((id) => {
      const row = [...final.values()].find((r) => r.memberId === id)!;
      return { memberId: id, category: row.category };
    }),
    newSlotLimit: peopleAfter > survivor.slotLimit ? slotsFor(peopleAfter) : null,
    peopleAfter,
  };
}

/** Plans for every owner with more than one Pod. Owners with one Pod, or none, are left alone. */
export function planMerges(pods: MergePodIn[]): OwnerPlan[] {
  const byOwner = new Map<string, MergePodIn[]>();
  for (const p of pods) byOwner.set(p.ownerId, [...(byOwner.get(p.ownerId) ?? []), p]);
  return [...byOwner.values()].filter((list) => list.length > 1).map(planOwnerMerge);
}
