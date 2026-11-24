import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { countByCategory, parsePodCategory, POD_CATEGORIES, POD_CATEGORY_LABELS } from "@/lib/pod-categories";
import { FREE_POD_MEMBER_LIMIT, isPodFull } from "@/lib/pod-limits";
import { nextSlotLimit, SLOT_STEP } from "@/lib/pod-slot-rules";

const read = (p: string) => readFileSync(p, "utf8");
/** The code without its comments, so a comment saying "no plan changes this" does not trip a rule about plans. */
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("Pod categories", () => {
  it("has the seven agreed categories, each with a label", () => {
    expect([...POD_CATEGORIES]).toEqual(["FAMILY", "FRIENDS", "SCHOOL", "CHURCH", "WORK", "NEIGHBOURS", "OTHER"]);
    for (const c of POD_CATEGORIES) expect(POD_CATEGORY_LABELS[c].length).toBeGreaterThan(0);
  });

  it("turns anything unknown into Other, so a bad value is never stored", () => {
    expect(parsePodCategory("CHURCH")).toBe("CHURCH");
    expect(parsePodCategory("church")).toBe("OTHER");
    expect(parsePodCategory("")).toBe("OTHER");
    expect(parsePodCategory(undefined)).toBe("OTHER");
    expect(parsePodCategory({ x: 1 })).toBe("OTHER");
  });

  it("counts per category and leaves out empty ones", () => {
    const rows = countByCategory([{ category: "FAMILY" }, { category: "FAMILY" }, { category: "WORK" }]);
    expect(rows.map((r) => [r.label, r.count])).toEqual([
      ["Family", 2],
      ["Work", 1],
    ]);
  });
});

describe("Pod slots", () => {
  it("starts at 20 and is full when every slot is used", () => {
    expect(FREE_POD_MEMBER_LIMIT).toBe(20);
    expect(isPodFull(19)).toBe(false);
    expect(isPodFull(20)).toBe(true);
    expect(isPodFull(20, 30)).toBe(false);
    expect(isPodFull(30, 30)).toBe(true);
  });

  const base = { slotLimit: 20, people: 20, ready: 10, complete: 10, passedRecently: true };

  it("adds ten slots only when full, with ten ready people and a recent pass", () => {
    expect(SLOT_STEP).toBe(10);
    expect(nextSlotLimit(base)).toBe(30);
    expect(nextSlotLimit({ ...base, people: 19 })).toBe(20); // room left: no growth needed
    expect(nextSlotLimit({ ...base, ready: 9 })).toBe(20);
    expect(nextSlotLimit({ ...base, passedRecently: false })).toBe(20);
  });

  it("grows one step at a time: the next step needs the Pod to fill again", () => {
    const first = nextSlotLimit(base);
    expect(nextSlotLimit({ ...base, slotLimit: first, people: 25 })).toBe(first);
    expect(nextSlotLimit({ ...base, slotLimit: first, people: first })).toBe(first + SLOT_STEP);
  });
});

describe("hard rules for one Pod per donor", () => {
  it("joining and invite code never mentions readiness or drills, and has no plan or money in it", () => {
    for (const f of [
      "app/api/invite/[token]/accept/route.ts",
      "app/api/pod/invite/route.ts",
      "app/api/pods/[podId]/invite/route.ts",
      "lib/pod-limits.ts",
      "lib/pod-invite.ts",
    ]) {
      expect(read(f), f).not.toMatch(/readiness|drill/i); // the existing rule: no words at all, comments included
      expect(code(f), f).not.toMatch(/upgrade|paystack|\bplan\b|pesewas/i);
    }
  });

  it("slot growth is never tied to a plan or a payment", () => {
    for (const f of ["lib/pod-slot-rules.ts", "lib/pod-slots.ts"]) {
      expect(code(f), f).not.toMatch(/subscription|paystack|upgrade|pesewas|\bplan\b/i);
    }
  });

  it("categories never reach admin screens, the leaderboard or alerts", () => {
    for (const f of [
      "lib/admin/insights.ts",
      "lib/admin/garden-leaderboard.ts",
      "lib/admin/pod-strength.ts",
      "components/admin/LeaderboardPoster.tsx",
      "lib/alerts.ts",
      "lib/alert-rules.ts",
    ]) {
      expect(read(f), f).not.toMatch(/PodCategory|pod-categories|\bcategory\b/);
    }
  });

  it("an unknown category from a request is cleaned before it is stored", () => {
    expect(read("app/api/pod/invite/route.ts")).toMatch(/parsePodCategory\(category\)/);
    expect(read("app/api/pods/[podId]/invite/route.ts")).toMatch(/parsePodCategory\(category\)/);
  });
});
