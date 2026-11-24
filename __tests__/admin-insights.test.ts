import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { median, safeCount, MIN_GROUP, duration } from "@/lib/admin/insights";

const read = (p: string) => readFileSync(p, "utf8");

describe("insights maths", () => {
  it("takes the median of odd and even lists, and none for an empty one", () => {
    expect(median([])).toBeNull();
    expect(median([30, 10, 20])).toBe(20);
    expect(median([10, 20, 30, 40])).toBe(25);
  });

  it("hides small groups but shows zero and large ones", () => {
    expect(safeCount(0)).toBe(0);
    expect(safeCount(1)).toBeNull();
    expect(safeCount(MIN_GROUP - 1)).toBeNull();
    expect(safeCount(MIN_GROUP)).toBe(MIN_GROUP);
  });

  it("writes durations in plain words", () => {
    expect(duration(null)).toBe("none yet");
    expect(duration(45)).toBe("45s");
    expect(duration(95)).toBe("1m 35s");
    expect(duration(3720)).toBe("1h 2m");
  });
});

describe("insights hard rules", () => {
  const page = read("app/admin/insights/page.tsx");
  const data = read("lib/admin/insights.ts");

  it("only admins can open the page", () => {
    expect(page).toContain("await requireAdmin()");
  });

  it("never selects a name, phone or email, and leaves out test alerts", () => {
    expect(data).not.toMatch(/\b(name|phone|email|avatarUrl)\s*:\s*true/);
    expect(data).not.toMatch(/"(name|phone|email)"/);
    expect(data).toContain("isTest: false");
  });
});
