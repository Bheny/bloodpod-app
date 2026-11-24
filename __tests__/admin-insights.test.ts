import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { median, safeCount, MIN_GROUP, duration } from "@/lib/admin/insights";
import { podStrength } from "@/lib/admin/pod-strength";

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

describe("pod strength in the Users list", () => {
  const s = (owned: number, joined: number, ready: number, size = ready) => podStrength({ owned, joined, ready, size }).key;

  it("reads a donor's progress from their best Pod", () => {
    expect(s(0, 0, 0)).toBe("none");
    expect(s(0, 2, 0)).toBe("member");
    expect(s(1, 0, 1)).toBe("building");
    expect(s(1, 0, 2)).toBe("building");
    expect(s(1, 0, 3)).toBe("ready");
    expect(s(1, 0, 4)).toBe("ready");
    expect(s(2, 0, 5)).toBe("strong");
    expect(s(1, 0, 9)).toBe("strong");
    expect(s(1, 0, 10)).toBe("complete");
  });

  it("names the next target, and none once strong", () => {
    expect(podStrength({ owned: 1, joined: 0, ready: 1, size: 2 }).target).toBe(3);
    expect(podStrength({ owned: 1, joined: 0, ready: 3, size: 3 }).target).toBe(5);
    expect(podStrength({ owned: 1, joined: 0, ready: 6, size: 8 }).target).toBe(10);
    expect(podStrength({ owned: 1, joined: 0, ready: 10, size: 12 }).target).toBeNull();
  });

  it("is read-only and admin-side: no write calls in the strength code", () => {
    const src = readFileSync("lib/admin/pod-strength.ts", "utf8");
    expect(src).not.toMatch(/\.(create|update|upsert|delete)(Many)?\(/);
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
