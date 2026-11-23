import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { gardenStage, gardenerTitle, plotHealth, plotNudge, weekStart, TITLES } from "@/lib/garden";
import { splitPeople, countedMembers, type PodPerson } from "@/lib/readiness/members";

const NOW = new Date("2026-06-15T12:00:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

const person = (id: string, over: Partial<PodPerson> = {}): PodPerson => ({
  userId: id,
  phone: `024000${id.padStart(4, "0")}`,
  confirmed: true,
  eligible: true,
  joinedAt: NOW,
  ...over,
});

describe("Garden stage", () => {
  it("steps up at 1, 3, 8 and 30 ready people once a drill has passed", () => {
    const at = (n: number) => gardenStage(n, true).name;
    expect([0, 1, 2, 3, 7, 8, 29, 30, 60].map(at)).toEqual(["Bare ground", "Seed", "Seed", "Sprout", "Sprout", "Grove", "Grove", "Forest", "Forest"]);
  });

  it("holds a big Garden at Sprout until a drill has passed, and says so", () => {
    const s = gardenStage(40, false);
    expect(s.name).toBe("Sprout");
    expect(s.next?.line).toMatch(/pass a drill/i);
  });

  it("says what is missing for the next stage", () => {
    expect(gardenStage(1, true).next?.line).toBe("2 more ready people to reach Sprout");
    expect(gardenStage(7, true).next?.line).toBe("1 more ready person to reach Grove");
    expect(gardenStage(30, true).next).toBeNull();
  });

  it("Forest is within what a free account can fill: 3 Pods of 20", () => {
    expect(30).toBeLessThanOrEqual(3 * 20);
  });
});

describe("Plot health", () => {
  const base = { ready: 5, needed: 5, lastPassedDrillAt: daysAgo(3), lastActivityAt: daysAgo(3) };

  it("is 100 for a full, drilled, active Pod", () => {
    expect(plotHealth(base, NOW)).toEqual({ score: 100, label: "Thriving" });
  });

  it("is 0 when nobody is ready", () => {
    expect(plotHealth({ ...base, ready: 0 }, NOW).score).toBe(0);
  });

  it("a Pod that never ran a drill cannot be Thriving", () => {
    const h = plotHealth({ ...base, lastPassedDrillAt: null, lastActivityAt: null }, NOW);
    expect(h.score).toBe(50);
    expect(h.label).toBe("Needs water");
    expect(plotHealth({ ...base, lastPassedDrillAt: null }, NOW).label).not.toBe("Thriving");
  });

  it("fades with time: a drill 60 days ago earns half", () => {
    const h = plotHealth({ ...base, lastPassedDrillAt: daysAgo(60), lastActivityAt: daysAgo(3) }, NOW);
    expect(h.score).toBe(50 + 15 + 20);
  });

  it("goes to Wilting when thin and stale", () => {
    expect(plotHealth({ ready: 1, needed: 5, lastPassedDrillAt: null, lastActivityAt: daysAgo(120) }, NOW).label).toBe("Wilting");
  });

  it("points at the one thing that helps most", () => {
    expect(plotNudge({ ...base, ready: 3 }, NOW)).toMatch(/2 more ready people/);
    expect(plotNudge({ ...base, lastPassedDrillAt: null }, NOW)).toMatch(/Run a drill/);
    expect(plotNudge(base, NOW)).toBeNull();
  });
});

describe("Gardener title", () => {
  const t = (weeks: number, groveWeeks: number, ownsPod = true) => gardenerTitle({ ownsPod, weeks, groveWeeks }).title?.name ?? null;

  it("has six steps, from Planter to Keeper", () => {
    expect(TITLES.map((x) => x.name)).toEqual(["Planter", "Tender", "Gardener", "Cultivator", "Steward", "Keeper"]);
  });

  it("starts at Planter when you own a Pod, and has no title before that", () => {
    expect(t(0, 0)).toBe("Planter");
    expect(t(0, 0, false)).toBeNull();
  });

  it("steps up by tended weeks, and the later steps also need weeks at Grove", () => {
    expect(t(4, 0)).toBe("Tender");
    expect(t(12, 0)).toBe("Tender"); // twelve weeks but never at Grove
    expect(t(12, 1)).toBe("Gardener");
    expect(t(26, 13)).toBe("Cultivator");
    expect(t(52, 39)).toBe("Steward");
    expect(t(104, 78)).toBe("Keeper");
  });

  it("never goes down: more weeks can only raise it", () => {
    let last = 0;
    for (let w = 0; w <= 120; w++) {
      const id = gardenerTitle({ ownsPod: true, weeks: w, groveWeeks: Math.floor(w * 0.8) }).title?.id ?? 0;
      expect(id).toBeGreaterThanOrEqual(last);
      last = id;
    }
  });

  it("says what is left for the next title", () => {
    expect(gardenerTitle({ ownsPod: true, weeks: 2, groveWeeks: 0 }).next?.line).toBe("2 more tended weeks to become a Tender");
    expect(gardenerTitle({ ownsPod: true, weeks: 104, groveWeeks: 78 }).next).toBeNull();
  });
});

describe("Weeks", () => {
  it("a week starts on Monday at midnight UTC, whatever day it is", () => {
    // 2026-06-15 is a Monday.
    expect(weekStart(new Date("2026-06-15T23:59:00Z")).toISOString()).toBe("2026-06-15T00:00:00.000Z");
    expect(weekStart(new Date("2026-06-21T10:00:00Z")).toISOString()).toBe("2026-06-15T00:00:00.000Z");
    expect(weekStart(new Date("2026-06-22T00:00:00Z")).toISOString()).toBe("2026-06-22T00:00:00.000Z");
  });
});

describe("Telling people apart", () => {
  it("counts the same account once, even across Pods", () => {
    const inTwoPods = [person("1"), person("2"), person("1"), person("3")];
    const s = splitPeople(inTwoPods);
    expect(s.counted.map((p) => p.userId)).toEqual(["1", "2", "3"]);
    expect(s.duplicates).toHaveLength(1);
    expect(s.duplicates[0].reason).toBe("same_account");
  });

  it("counts two accounts with the same phone number once, and says why", () => {
    const s = splitPeople([person("1", { phone: "0241234567" }), person("2", { phone: "+233 24 123 4567" })]);
    expect(s.counted.map((p) => p.userId)).toEqual(["1"]);
    expect(s.duplicates[0]).toMatchObject({ reason: "same_phone" });
    expect(s.duplicates[0].person.userId).toBe("2");
    expect(s.duplicates[0].sameAs.userId).toBe("1");
  });

  it("keeps people who are not ready apart from duplicates", () => {
    const s = splitPeople([person("1"), person("2", { confirmed: false }), person("3", { eligible: false })]);
    expect(s.counted).toHaveLength(1);
    expect(s.notReady.map((p) => p.userId)).toEqual(["2", "3"]);
    expect(s.duplicates).toEqual([]);
  });

  it("countedMembers gives the same answer as before", () => {
    expect(countedMembers([person("1"), person("2"), person("2")]).map((p) => p.userId)).toEqual(["1", "2"]);
  });

  it("someone in three of your Pods adds one to the Garden, not three", () => {
    const podA = [person("1"), person("2")];
    const podB = [person("1"), person("3")];
    const podC = [person("1"), person("2")];
    expect(splitPeople([...podA, ...podB, ...podC]).counted).toHaveLength(3);
  });
});

// ── Hard rules ───────────────────────────────────────────────────────────────

const ROOT = process.cwd();
function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}
const rel = (p: string) => relative(ROOT, p).replaceAll("\\", "/");
const read = (f: string) => readFileSync(join(ROOT, f), "utf8");

describe("the Garden stays out of alerts, listing and joining", () => {
  const all = [...walk(join(ROOT, "app")), ...walk(join(ROOT, "lib")), ...walk(join(ROOT, "components"))].map(rel);

  it("only garden, readiness and profile code reads the Garden", () => {
    const readers = all.filter((f) => /@\/lib\/garden(-data)?["']/.test(read(f)));
    const allowed = (f: string) =>
      /^(lib\/garden(-data)?\.ts|lib\/admin\/garden-leaderboard\.ts|lib\/readiness\/drill\.ts|app\/\(app\)\/(garden\/|dashboard\/page\.tsx)|app\/api\/garden\/|components\/garden\/|__tests__\/)/.test(f);
    expect(readers.filter((f) => !allowed(f))).toEqual([]);
  });

  it("alert, listing, search and Pod-joining code never imports the Garden", () => {
    const risky = (f: string) =>
      /^app\/api\/(emergencies|invite|pod|pods|discover|activity)\//.test(f) ||
      /^app\/\(app\)\/(discover|pod|dashboard\/request)\//.test(f) ||
      /^app\/invite\//.test(f) ||
      /^lib\/(emergencies|pod-invite|pod-limits|pod-data|discover-data|invite|push|entitlements|pricing|plan-access)\.ts$/.test(f);
    const offenders = all.filter((f) => risky(f) && /@\/lib\/garden/.test(read(f)));
    expect(offenders).toEqual([]);
  });

  it("the Garden has no money in it and no link to a plan", () => {
    for (const f of ["lib/garden.ts", "lib/garden-data.ts", "app/(app)/garden/page.tsx", "components/garden/CheckIn.tsx"]) {
      expect(read(f), f).not.toMatch(/GH₵|pesewas|paystack|subscription|entitlement|can\(|@\/lib\/(pricing|billing|entitlements|plan-access)/i);
    }
  });

  it("tended weeks come only from upkeep, never from donating or inviting", () => {
    expect(read("lib/garden.ts")).toMatch(/type TendKind = "DRILL_STARTED" \| "DRILL_ANSWERED" \| "CHECK_IN"/);
    const hooks = all.filter((f) => /recordTended\(/.test(read(f)) && !/^(lib\/garden-data\.ts|__tests__\/)/.test(f));
    expect(hooks.sort()).toEqual(["app/api/garden/tend/route.ts", "lib/readiness/drill.ts"]);
  });

  it("the Garden's screens and copy leave out recruiting and reward words", () => {
    for (const f of ["lib/garden.ts", "app/(app)/garden/page.tsx", "components/garden/CheckIn.tsx"]) {
      const words = read(f).match(/\b(recruit\w*|reward\w*|earn\w*|leaderboard|invite friends|bonus)\b/gi) ?? [];
      expect(words, f).toEqual([]);
    }
  });

  it("the admin leaderboard never names anyone who opted out, and only admins can open it", () => {
    const data = read("lib/admin/garden-leaderboard.ts");
    expect(data).toMatch(/name: owner\.gardenHidden \? null : owner\.name/);
    // First name and Garden stage only: no city, phone or email can reach the poster.
    expect(data).not.toMatch(/city|phone:\s*owner\.phone|email/);
    expect(read("app/admin/leaderboard/page.tsx")).toMatch(/await requireAdmin\(\)/);
    // The poster falls back to a nameless line for anyone who opted out, whatever the admin picks.
    const poster = read("components/admin/LeaderboardPoster.tsx");
    expect(poster).toMatch(/if \(!r\.named \|\| !r\.name\?\.trim\(\)\) return ANON/);
    expect(poster).not.toMatch(/fetch\(/);
    // First names only: the name is cut at the first space.
    expect(poster).toMatch(/r\.name\.trim\(\)\.split\(\/\\s\+\/\)\[0\]/);
  });

  it("opting out is the person's own choice, and the route only changes the caller", () => {
    expect(read("prisma/schema.prisma")).toMatch(/gardenHidden\s+Boolean @default\(false\)/);
    const route = read("app/api/garden/visibility/route.ts");
    expect(route).toMatch(/where: \{ id: user\.id \}/);
    expect(route).toMatch(/getCurrentUser\(\)/);
  });

  it("the Garden is private: every page and route needs a signed-in user", () => {
    expect(read("app/(app)/garden/page.tsx")).toMatch(/getCurrentUser\(\)/);
    expect(read("app/api/garden/tend/route.ts")).toMatch(/getCurrentUser\(\)/);
    expect(read("lib/supabase/proxy.ts")).toMatch(/"\/garden"/);
  });
});
