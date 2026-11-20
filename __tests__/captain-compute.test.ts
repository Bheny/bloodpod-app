import { describe, expect, it } from "vitest";
import { computeCaptainLevel, countedMembers, drillPassed, uniqueDonorCount } from "@/lib/captain/compute";
import { findIntegrityFlags } from "@/lib/captain/integrity";
import { lapseStage } from "@/lib/captain/lapse";
import { CAPTAIN, DESCENDANT_PODS_BY_LEVEL } from "@/lib/captain-config";
import type { TreeDrill, TreeMember, TreePod } from "@/lib/captain/types";

const NOW = new Date("2026-11-20T12:00:00Z");
const DAY = 86_400_000;
let n = 0;

/** A fresh, unique, verified, eligible person. Phones never collide unless a test makes them. */
function person(over: Partial<TreeMember> = {}): TreeMember {
  n++;
  return {
    userId: `u${n}`,
    phone: `0244${String(100000 + n * 7)}`,
    phoneVerified: true,
    eligible: true,
    joinedAt: new Date(NOW.getTime() - 30 * DAY + n * 3_600_000),
    ...over,
  };
}

const passing: TreeDrill = { startedAt: new Date(NOW.getTime() - 5 * DAY), eligibleCount: 5, respondedInWindow: 4 };

function pod(opts: { people?: number; drills?: TreeDrill[]; children?: TreePod[]; active?: boolean; leader?: Partial<TreeMember> } = {}): TreePod {
  const leader = person(opts.leader);
  const others = Array.from({ length: (opts.people ?? 5) - 1 }, () => person());
  n++;
  return {
    id: `p${n}`,
    leaderId: leader.userId,
    leaderPhone: leader.phone,
    leaderPhoneVerified: leader.phoneVerified,
    createdAt: new Date(NOW.getTime() - 20 * DAY + n * 3_600_000 * 5),
    lastResponseAt: opts.active === false ? null : new Date(NOW.getTime() - 3 * DAY),
    members: [leader, ...others],
    drills: opts.drills ?? [],
    children: opts.children ?? [],
  };
}

/** The smallest tree that is exactly at level k: every Pod has 5 people, and each parent has just enough children. */
function atLevel(k: number): TreePod {
  const kids = k === 0 ? 1 : 3;
  const childLevel = k <= 1 ? null : k - 2;
  const children = Array.from({ length: kids }, () => (childLevel === null ? pod({ drills: [passing] }) : atLevel(childLevel)));
  return pod({ drills: [passing], children });
}

const descendants = (p: TreePod): number => p.children.reduce((sum, c) => sum + 1 + descendants(c), 0);

describe("levels", () => {
  it("a Pod with no drill is a Starter, however many children it has", () => {
    const tree = pod({ children: [pod(), pod(), pod()] });
    expect(computeCaptainLevel(tree, NOW).level).toBeNull();
  });

  it("a passed drill with no children is still a Starter", () => {
    expect(computeCaptainLevel(pod({ drills: [passing] }), NOW).level).toBeNull();
  });

  it("one qualifying child is level 0, two is still 0, three is level 1", () => {
    expect(computeCaptainLevel(pod({ drills: [passing], children: [pod()] }), NOW).level).toBe(0);
    expect(computeCaptainLevel(pod({ drills: [passing], children: [pod(), pod()] }), NOW).level).toBe(0);
    expect(computeCaptainLevel(pod({ drills: [passing], children: [pod(), pod(), pod()] }), NOW).level).toBe(1);
  });

  it("three children are not enough for level 2 unless their leaders are level 0 or higher", () => {
    const plain = pod({ drills: [passing], children: [pod(), pod(), pod()] });
    expect(computeCaptainLevel(plain, NOW).level).toBe(1);
    const grown = pod({ drills: [passing], children: [atLevel(0), atLevel(0), atLevel(0)] });
    expect(computeCaptainLevel(grown, NOW).level).toBe(2);
  });

  it("level 2 needs all three children at level 0, not two", () => {
    const two = pod({ drills: [passing], children: [atLevel(0), atLevel(0), pod()] });
    expect(computeCaptainLevel(two, NOW).level).toBe(1);
  });

  it.each([0, 1, 2, 3, 4, 5])("the smallest tree for level %i computes to it, with the expected number of Pods", (k) => {
    const tree = atLevel(k);
    expect(computeCaptainLevel(tree, NOW).level).toBe(k);
    expect(descendants(tree)).toBe(DESCENDANT_PODS_BY_LEVEL[k]);
  });

  it("the drill must stay passed: take it away and every level falls to Starter", () => {
    for (const k of [0, 1, 2, 3, 4, 5]) {
      const tree = atLevel(k);
      tree.drills = [];
      expect(computeCaptainLevel(tree, NOW).level).toBeNull();
    }
  });

  it("level 5 is the top: nothing is next", () => {
    const r = computeCaptainLevel(atLevel(5), NOW);
    expect(r.nextLevel).toBeNull();
    expect(r.checklist).toEqual([]);
  });
});

describe("drills", () => {
  it("60% passes and 59% does not", () => {
    expect(drillPassed(pod({ drills: [{ ...passing, eligibleCount: 100, respondedInWindow: 60 }] }))).toBe(true);
    expect(drillPassed(pod({ drills: [{ ...passing, eligibleCount: 100, respondedInWindow: 59 }] }))).toBe(false);
  });

  it("5 people need 3 answers; 2 is not enough", () => {
    expect(drillPassed(pod({ drills: [{ ...passing, eligibleCount: 5, respondedInWindow: 3 }] }))).toBe(true);
    expect(drillPassed(pod({ drills: [{ ...passing, eligibleCount: 5, respondedInWindow: 2 }] }))).toBe(false);
  });

  it("a 4-member Pod cannot pass a drill, even if all four answer", () => {
    expect(drillPassed(pod({ people: 4, drills: [{ ...passing, eligibleCount: 4, respondedInWindow: 4 }] }))).toBe(false);
  });

  it("any one passed drill is enough", () => {
    const failed = { ...passing, respondedInWindow: 1 };
    expect(drillPassed(pod({ drills: [failed, passing] }))).toBe(true);
  });
});

describe("who counts", () => {
  it("only verified, eligible people count, and each once", () => {
    const a = person();
    const dup = { ...a };
    const unverified = person({ phoneVerified: false });
    const resting = person({ eligible: false });
    const p = { ...pod(), members: [a, dup, unverified, resting, person()] };
    expect(countedMembers(p)).toHaveLength(2);
  });

  it("two accounts with the same phone number are one person", () => {
    const a = person({ phone: "0244000111" });
    const b = person({ phone: "+233244000111" });
    expect(countedMembers({ ...pod(), members: [a, b] })).toHaveLength(1);
  });

  it("counts a person once across a whole tree", () => {
    const shared = person();
    const child = { ...pod(), members: [person(), shared, person()] };
    const root = { ...pod(), members: [person(), shared, person(), person()], children: [child] };
    expect(uniqueDonorCount(root)).toBe(4 + 3 - 1);
  });

  it("a tree of all-different people counts everyone", () => {
    const tree = atLevel(1);
    expect(uniqueDonorCount(tree)).toBe(5 * (1 + descendants(tree)));
  });
});

describe("qualifying child Pods", () => {
  const parent = (children: TreePod[]) => pod({ drills: [passing], children });

  it("needs 3 people including the leader: 2 is not enough", () => {
    const r = computeCaptainLevel(parent([pod({ people: 2 })]), NOW);
    expect(r.level).toBeNull();
    expect(r.children[0].reason).toBe("needs_members");
  });

  it("an unverified child leader does not count", () => {
    const r = computeCaptainLevel(parent([pod({ leader: { phoneVerified: false } })]), NOW);
    expect(r.children[0].qualifying).toBe(false);
  });

  it("an inactive child does not count: 59 days is fine, 61 is not", () => {
    const fresh = pod();
    fresh.lastResponseAt = new Date(NOW.getTime() - 59 * DAY);
    const stale = pod();
    stale.lastResponseAt = new Date(NOW.getTime() - 61 * DAY);
    expect(computeCaptainLevel(parent([fresh]), NOW).level).toBe(0);
    const r = computeCaptainLevel(parent([stale]), NOW);
    expect(r.level).toBeNull();
    expect(r.children[0].reason).toBe("needs_activity");
  });

  it("a child that never answered anything does not count", () => {
    expect(computeCaptainLevel(parent([pod({ active: false })]), NOW).level).toBeNull();
  });

  it("a child led by the same person, or by the same phone number, does not count", () => {
    const root = parent([]);
    const sameAccount = pod({ leader: { userId: root.leaderId, phone: "0244999111" } });
    const samePhone = pod({ leader: { phone: root.leaderPhone, userId: "someone-else" } });
    expect(computeCaptainLevel({ ...root, children: [sameAccount] }, NOW).children[0].reason).toBe("same_person");
    expect(computeCaptainLevel({ ...root, children: [samePhone] }, NOW).children[0].reason).toBe("same_person");
  });

  it("the same friends cannot make three Pods", () => {
    const friends = [person(), person(), person(), person()];
    const make = () => {
      const p = pod({ people: 3 });
      p.members = [p.members[0], friends[0], friends[1]]; // same two friends every time
      return p;
    };
    const r = computeCaptainLevel(parent([make(), make(), make()]), NOW);
    expect(r.qualifyingChildren).toBe(1);
    expect(r.level).toBe(0);
  });
});

describe("what is still needed", () => {
  it("a small Starter is told to invite people first", () => {
    const r = computeCaptainLevel(pod({ people: 3 }), NOW);
    expect(r.nextLevel).toBe(0);
    expect(r.checklist[0]).toMatchObject({ key: "people", done: false, action: "invite" });
  });

  it("a Starter with enough people is told to run a drill", () => {
    const r = computeCaptainLevel(pod({ people: 5 }), NOW);
    expect(r.checklist.find((c) => c.key === "drill")).toMatchObject({ done: false, action: "drill" });
  });

  it("after the drill, the next step is helping someone start a Pod", () => {
    const r = computeCaptainLevel(pod({ drills: [passing] }), NOW);
    expect(r.checklist.find((c) => c.key === "children")).toMatchObject({ done: false, detail: "0 of 1", action: "spinoff" });
  });

  it("a level 0 Captain is working toward level 1", () => {
    const r = computeCaptainLevel(pod({ drills: [passing], children: [pod()] }), NOW);
    expect(r.nextLevel).toBe(1);
    expect(r.checklist.find((c) => c.key === "children")?.detail).toBe("1 of 3");
  });
});

describe("integrity flags", () => {
  it("flags leaders who share a number, or whose numbers are neighbours, without blocking anything", () => {
    const root = pod({ drills: [passing], leader: { phone: "0244123400" } });
    const same = pod({ leader: { phone: "+233244123400" } });
    const near = pod({ leader: { phone: "0244123401" } });
    const flags = findIntegrityFlags({ ...root, children: [same, near] });
    expect(flags.map((f) => f.code)).toEqual(expect.arrayContaining(["same_phone", "phone_pattern"]));
  });

  it("flags a child Pod created minutes after the parent, and a burst of joins", () => {
    const root = pod();
    const child = pod();
    child.createdAt = new Date(root.createdAt.getTime() + 4 * 60_000);
    const burst = { ...pod(), members: Array.from({ length: 6 }, (_, i) => person({ joinedAt: new Date(NOW.getTime() + i * 10_000) })) };
    const flags = findIntegrityFlags({ ...root, children: [child, burst] });
    expect(flags.some((f) => f.code === "created_fast" && f.podId === child.id)).toBe(true);
    expect(flags.some((f) => f.code === "burst_joins" && f.podId === burst.id)).toBe(true);
  });

  it("a flagged Pod still computes as before: flags go to review, never to a block", () => {
    const root = pod({ drills: [passing], leader: { phone: "0244123400" } });
    const child = pod({ leader: { phone: "0244123401" } });
    expect(findIntegrityFlags({ ...root, children: [child] }).length).toBeGreaterThan(0);
    expect(computeCaptainLevel({ ...root, children: [child] }, NOW).level).toBe(0);
  });

  it("clean trees raise nothing", () => {
    expect(findIntegrityFlags(atLevel(1))).toEqual([]);
  });
});

describe("lapse", () => {
  const start = new Date("2026-09-01T00:00:00Z");
  const after = (days: number) => new Date(start.getTime() + days * DAY);

  it("nothing is running until the requirements stop being met", () => {
    expect(lapseStage(null, NOW).stage).toBe("ok");
  });

  it("the badge stays through the grace period, warns at day 30, lapses at day 60", () => {
    expect(lapseStage(start, after(10)).stage).toBe("grace");
    expect(lapseStage(start, after(29)).stage).toBe("grace");
    expect(lapseStage(start, after(30)).stage).toBe("warn");
    expect(lapseStage(start, after(59)).stage).toBe("warn");
    expect(lapseStage(start, after(60)).stage).toBe("lapsed");
    expect(lapseStage(start, after(59)).daysLeft).toBe(1);
  });

  it("uses the configured numbers", () => {
    expect(CAPTAIN.lapseGraceDays).toBe(60);
    expect(CAPTAIN.lapseWarnAfterDays).toBe(30);
  });
});
