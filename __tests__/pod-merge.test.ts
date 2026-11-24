import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { guessCategory, pickSurvivor, planMerges, planOwnerMerge, type MergePodIn } from "@/lib/pod-merge";
import type { PodCategoryId } from "@/lib/pod-categories";

const day = (n: number) => new Date(Date.UTC(2026, 0, n));
let seq = 0;
const member = (userId: string, category: PodCategoryId = "OTHER") => ({ id: `m${++seq}`, userId, category });
const pod = (id: string, name: string, created: number, members: ReturnType<typeof member>[], owner = "owner1", slotLimit = 20): MergePodIn => ({
  id,
  name,
  ownerId: owner,
  createdAt: day(created),
  slotLimit,
  members,
});

describe("guessing a category from a Pod's name", () => {
  it("reads clear names", () => {
    expect(guessCategory("Bernard's Family")).toBe("FAMILY");
    expect(guessCategory("Grace Chapel fellowship")).toBe("CHURCH");
    expect(guessCategory("Achimota School class of 2012")).toBe("SCHOOL");
    expect(guessCategory("Office team")).toBe("WORK");
    expect(guessCategory("Street neighbours")).toBe("NEIGHBOURS");
    expect(guessCategory("Weekend squad")).toBe("FRIENDS");
  });
  it("falls back to Other when the name says nothing", () => {
    expect(guessCategory("Bernard's Pod")).toBe("OTHER");
    expect(guessCategory("")).toBe("OTHER");
    expect(guessCategory("Familiar faces")).toBe("OTHER"); // not "family"
  });
});

describe("choosing the Pod that stays", () => {
  it("is the one with the most members, then the oldest", () => {
    const a = pod("a", "A", 1, [member("u1")]);
    const b = pod("b", "B", 2, [member("u2"), member("u3")]);
    const c = pod("c", "C", 3, [member("u4"), member("u5")]);
    expect(pickSurvivor([a, b, c]).id).toBe("b");
    expect(pickSurvivor([a, a]).id).toBe("a");
  });
});

describe("merging one owner's Pods", () => {
  it("moves members across, with a category from the old Pod's name", () => {
    const keep = pod("keep", "Main", 1, [member("u1"), member("u2"), member("u3")]);
    const church = pod("church", "Church group", 2, [member("u4"), member("u5")]);
    const plan = planOwnerMerge([keep, church]);
    expect(plan.survivorId).toBe("keep");
    expect(plan.removed.map((r) => r.id)).toEqual(["church"]);
    expect(plan.moves.map((m) => [m.userId, m.category])).toEqual([
      ["u4", "CHURCH"],
      ["u5", "CHURCH"],
    ]);
    expect(plan.peopleAfter).toBe(6); // five members and the owner
    expect(plan.newSlotLimit).toBeNull();
  });

  it("counts a person in two Pods once", () => {
    const keep = pod("keep", "Main", 1, [member("u1"), member("u2")]);
    const other = pod("other", "School friends", 2, [member("u2"), member("u3")]);
    const plan = planOwnerMerge([keep, other]);
    expect(plan.duplicates.map((d) => d.userId)).toEqual(["u2"]);
    expect(plan.moves.map((m) => m.userId)).toEqual(["u3"]);
    expect(plan.peopleAfter).toBe(4);
  });

  it("lets a duplicate improve an Other row, and never overrides a category the owner set", () => {
    const keep = pod("keep", "Main", 1, [member("u1", "OTHER"), member("u2", "FRIENDS")]);
    const other = pod("other", "Family", 2, [member("u1"), member("u2")]);
    const plan = planOwnerMerge([keep, other]);
    expect(plan.recategorised.map((r) => r.category)).toEqual(["FAMILY"]); // u1 only
  });

  it("keeps a category the owner already set on a moved person", () => {
    const keep = pod("keep", "Main", 1, [member("u1"), member("u2")]);
    const other = pod("other", "Family", 2, [member("u3", "WORK")]);
    expect(planOwnerMerge([keep, other]).moves[0].category).toBe("WORK");
  });

  it("drops the owner if they appear as a member of their own other Pod", () => {
    const keep = pod("keep", "Main", 1, [member("u1"), member("u2")]);
    const other = pod("other", "Odd", 2, [member("owner1")]);
    const plan = planOwnerMerge([keep, other]);
    expect(plan.duplicates.map((d) => d.userId)).toEqual(["owner1"]);
    expect(plan.moves).toEqual([]);
  });

  it("raises the slot limit only when the merged Pod would not fit", () => {
    const many = (n: number, start: number) => Array.from({ length: n }, (_, i) => member(`u${start + i}`));
    const fits = planOwnerMerge([pod("a", "A", 1, many(12, 0)), pod("b", "B", 2, many(5, 100))]);
    expect(fits.newSlotLimit).toBeNull(); // 12 + 5 + owner = 18
    const over = planOwnerMerge([pod("a", "A", 1, many(15, 0)), pod("b", "B", 2, many(10, 100))]);
    expect(over.peopleAfter).toBe(26);
    expect(over.newSlotLimit).toBe(30);
  });

  it("leaves owners with one Pod, or none, alone", () => {
    const solo = pod("solo", "Solo", 1, [member("u1")], "owner2");
    const two = [pod("a", "A", 1, [member("u2")], "owner3"), pod("b", "B", 2, [member("u3")], "owner3")];
    const plans = planMerges([solo, ...two]);
    expect(plans.map((p) => p.ownerId)).toEqual(["owner3"]);
  });
});

describe("the merge script is careful", () => {
  const script = readFileSync("scripts/merge-pods.ts", "utf8");
  it("is a dry run unless asked, and will not apply without a backup flag", () => {
    expect(script).toMatch(/process\.argv\.includes\("--apply"\)/);
    expect(script).toMatch(/--i-have-a-backup/);
    expect(script).toMatch(/Dry run: nothing was changed/);
  });
  it("merges each owner in its own transaction and moves everything that points at a Pod before deleting it", () => {
    expect(script).toMatch(/prisma\.\$transaction\(/);
    for (const table of ["podMember", "podInvite", "drill", "bloodRequest", "careProfile"]) expect(script).toMatch(new RegExp(`tx\\.${table}\\.`));
    expect(script.indexOf("tx.drill.updateMany")).toBeLessThan(script.indexOf("tx.pod.deleteMany"));
  });
  it("keeps the one-per-owner rule out of the migrations until the merge has run", () => {
    expect(readFileSync("prisma/pending/one_pod_per_owner/migration.sql", "utf8")).toMatch(/CREATE UNIQUE INDEX "Pod_ownerId_key"/);
    expect(readFileSync("prisma/schema.prisma", "utf8")).not.toMatch(/@@unique\(\[ownerId\]\)/);
  });
});
