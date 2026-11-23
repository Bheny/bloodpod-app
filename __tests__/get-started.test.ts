import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { INVITE_TARGET, STEPS, computeSteps, isStepId, progressOf, type Facts } from "@/lib/get-started";
import { GLOSSARY } from "@/lib/glossary";

const NOTHING: Facts = {
  hasBloodType: false,
  hasPush: false,
  invitedCount: 0,
  drillsRun: 0,
  isPublic: false,
  hasEmergencyContact: false,
  donationCount: 0,
};

const stateOf = (facts: Partial<Facts>, seen: string[] = []) => computeSteps({ ...NOTHING, ...facts }, seen);
const done = (facts: Partial<Facts>, seen: string[] = []) => stateOf(facts, seen).filter((s) => s.done).map((s) => s.id);

describe("get started: a step is done because it was done", () => {
  it("starts with nothing done and the first step next", () => {
    const p = progressOf(stateOf({}));
    expect(p.done).toBe(0);
    expect(p.total).toBe(STEPS.length);
    expect(p.next?.id).toBe("blood");
    expect(p.allDone).toBe(false);
  });

  it("each step ticks from the real thing", () => {
    expect(done({ hasBloodType: true })).toEqual(["blood"]);
    expect(done({ hasPush: true })).toEqual(["alerts"]);
    expect(done({ drillsRun: 1 })).toEqual(["drill"]);
    expect(done({ isPublic: true })).toEqual(["discover"]);
    expect(done({ hasEmergencyContact: true })).toEqual(["contact"]);
    expect(done({ donationCount: 1 })).toEqual(["donation"]);
  });

  it("inviting needs the full number of different people, not one", () => {
    expect(done({ invitedCount: INVITE_TARGET - 1 })).toEqual([]);
    expect(done({ invitedCount: INVITE_TARGET })).toEqual(["invite"]);
  });

  it("a skipped step counts as done, and says it was skipped", () => {
    const s = stateOf({}, ["donation"]).find((x) => x.id === "donation")!;
    expect(s.done).toBe(true);
    expect(s.skipped).toBe(true);
  });

  it("a step done for real is not shown as skipped, even if it was skipped first", () => {
    const s = stateOf({ donationCount: 2 }, ["donation"]).find((x) => x.id === "donation")!;
    expect(s.done).toBe(true);
    expect(s.skipped).toBe(false);
  });

  it("staying unlisted in Discover is a fine answer: opening it is enough", () => {
    expect(done({}, ["discover"])).toEqual(["discover"]);
  });

  it("moves on to the next step that is still open, in order", () => {
    const p = progressOf(stateOf({ hasBloodType: true, hasPush: true }));
    expect(p.done).toBe(2);
    expect(p.next?.id).toBe("invite");
  });

  it("is finished only when every step is done or skipped", () => {
    const all = progressOf(stateOf({}, STEPS.map((s) => s.id)));
    expect(all.allDone).toBe(true);
    expect(all.next).toBeNull();
  });

  it("only knows its own steps", () => {
    expect(isStepId("blood")).toBe(true);
    expect(isStepId("nonsense")).toBe(false);
    expect(isStepId("")).toBe(false);
  });
});

describe("get started: the browser cannot say a step is finished", () => {
  const route = readFileSync(join(process.cwd(), "app/api/get-started/route.ts"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

  it("the route records visits, skips, hiding and the tour, and nothing that marks a step done", () => {
    expect(route).toMatch(/"seen"/);
    expect(route).toMatch(/"tour-done"/);
    expect(route).not.toMatch(/bloodType|isPublic|pushSubscription|donation|emergencyContact/);
  });

  it("a step can only be named by a real step id", () => {
    expect(route).toMatch(/isStepId/);
  });
});

describe("tooltips", () => {
  it("every term explains itself in plain words", () => {
    for (const [id, entry] of Object.entries(GLOSSARY)) {
      expect(entry.title.length, id).toBeGreaterThan(2);
      expect(entry.body.length, id).toBeGreaterThan(40);
      // Short enough to read in a tap: two or three sentences.
      expect(entry.body.length, id).toBeLessThan(320);
    }
  });

  it("every step's tip is a real term", () => {
    for (const step of STEPS) if (step.tip) expect(GLOSSARY).toHaveProperty(step.tip);
  });

  it("'Pod ready' quotes the real threshold, so it cannot drift from the rule", () => {
    const src = readFileSync(join(process.cwd(), "components/dashboard/PodReadyCard.tsx"), "utf8");
    const threshold = src.match(/export const POD_READY_THRESHOLD = (\d+)/)?.[1];
    expect(threshold).toBeDefined();
    expect(GLOSSARY.podReady.body).toContain(`${threshold} people`);
  });

  it("the glossary never promises what the app does not do", () => {
    const text = Object.values(GLOSSARY).map((e) => e.body).join(" ");
    // These words belong to features that do not exist: tooltips must not sell them.
    expect(text).not.toMatch(/airtime|reward|cash|earn|paid for/i);
  });
});
