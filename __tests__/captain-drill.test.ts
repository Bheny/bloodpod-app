import { describe, expect, it } from "vitest";
import { drillClosesAt, drillResult } from "@/lib/captain/drill";

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
