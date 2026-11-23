import { describe, expect, it } from "vitest";
import { drillClosesAt, drillResult } from "@/lib/readiness/drill";
import { countedMembers, phoneKey, type PodPerson } from "@/lib/readiness/members";

describe("drill result", () => {
  it("passes at 60% of at least 5 eligible people", () => {
    expect(drillResult(5, 3)).toBe(true);
    expect(drillResult(5, 2)).toBe(false);
    expect(drillResult(100, 60)).toBe(true);
    expect(drillResult(100, 59)).toBe(false);
  });

  it("never passes with fewer than 5 eligible people", () => {
    expect(drillResult(4, 4)).toBe(false);
    expect(drillResult(0, 0)).toBe(false);
  });

  it("closes 10 minutes after it starts", () => {
    const startedAt = new Date("2026-11-20T10:00:00Z");
    expect(drillClosesAt({ startedAt, windowMinutes: 10 }).toISOString()).toBe("2026-11-20T10:10:00.000Z");
  });
});

const person = (over: Partial<PodPerson> & { userId: string }): PodPerson => ({
  phone: null,
  confirmed: true,
  eligible: true,
  joinedAt: new Date("2026-01-01T00:00:00Z"),
  ...over,
});

describe("who counts as ready", () => {
  it("counts only verified, eligible people", () => {
    const out = countedMembers([
      person({ userId: "a", phone: "0241234567" }),
      person({ userId: "b", phone: "0241234568", confirmed: false }),
      person({ userId: "c", phone: "0241234569", eligible: false }),
    ]);
    expect(out.map((m) => m.userId)).toEqual(["a"]);
  });

  it("counts one person once, even with two accounts on the same number", () => {
    const out = countedMembers([
      person({ userId: "a", phone: "024 123 4567" }),
      person({ userId: "b", phone: "+233241234567" }),
    ]);
    expect(out).toHaveLength(1);
  });

  it("counts the same account once", () => {
    expect(countedMembers([person({ userId: "a" }), person({ userId: "a" })])).toHaveLength(1);
  });

  it("reads a phone number by its last nine digits", () => {
    expect(phoneKey("024 123 4567")).toBe(phoneKey("+233 24 123 4567"));
    expect(phoneKey("123")).toBeNull();
  });
});
