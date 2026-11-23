import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { PLEDGE } from "@/lib/readiness-config";

const ROOT = process.cwd();
const rel = (p: string) => relative(ROOT, p).replaceAll("\\", "/");

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

const all = [...walk(join(ROOT, "app")), ...walk(join(ROOT, "lib")), ...walk(join(ROOT, "components"))].map(rel);
const read = (f: string) => readFileSync(join(ROOT, f), "utf8");

/** Everything that decides who is alerted, how loudly or in what order. Pod readiness has no say in any of it. */
const ALERT_CODE = (f: string) =>
  /^lib\/(push|emergencies|discover-data|pending-invites|activity)\.ts$/.test(f) ||
  /^app\/api\/(emergencies|push|discover)\//.test(f) ||
  /^app\/\(app\)\/(discover|dashboard\/request)\//.test(f) ||
  /^components\/dashboard\/(EmergencySlot|SendAlertButton)/.test(f);

const READINESS_CODE = (f: string) => /^lib\/readiness|^components\/readiness\/|^app\/\(app\)\/pod\/ready\/|^app\/api\/readiness\/|^app\/api\/cron\/drills\//.test(f);

describe("readiness hard rules", () => {
  it("the old Captain hierarchy is gone for good", () => {
    const offenders = all.filter((f) => /captain/i.test(read(f)));
    expect(offenders).toEqual([]);
  });

  it("alert code never imports readiness code or reads a drill", () => {
    const offenders: string[] = [];
    for (const f of all.filter(ALERT_CODE)) {
      const src = read(f);
      if (/@\/lib\/readiness|@\/components\/readiness/.test(src)) offenders.push(`${f}: imports readiness code`);
      if (/prisma\.drill\b/.test(src)) offenders.push(`${f}: reads drills`);
    }
    expect(offenders).toEqual([]);
  });

  it("drill recipients are picked by readiness, never by plan or rank", () => {
    const src = read("lib/readiness/drill.ts");
    expect(src).not.toMatch(/subscription|entitlements|SubscriptionPlan|\.plan\b|passportTier|podStrengthScore/i);
  });

  it("no money, airtime or payment is tied to readiness", () => {
    const files = all.filter(READINESS_CODE);
    expect(files.length).toBeGreaterThan(0);
    const offenders: string[] = [];
    for (const f of files) {
      // The pledge itself says "payment", so take it out before looking.
      const src = read(f).split(PLEDGE).join("").replace(/PLEDGE\s*=\s*"[^"]*"/, "");
      if (/airtime|cashReward|cash\b|pesewas|paystack|GH₵|payout|bonus|commission|stipend/i.test(src)) offenders.push(f);
    }
    expect(offenders).toEqual([]);
  });

  it("the pledge says what it must", () => {
    expect(PLEDGE).toBe("I will never ask for, offer or accept payment for donating blood.");
  });

  it("readiness code never gates joining a Pod, or charges to be listed", () => {
    const joining = all.filter((f) => /^app\/api\/invite\/|^app\/invite\/|^lib\/(pod-invite|pod-limits)\.ts$/.test(f));
    for (const f of joining) expect(read(f)).not.toMatch(/readiness|drill/i);
  });

  it("every readiness page and API needs a signed-in person", () => {
    const pages = all.filter((f) => /^app\/\(app\)\/pod\/ready\/.*page\.tsx$/.test(f));
    const apis = all.filter((f) => /^app\/api\/readiness\/.*route\.ts$/.test(f));
    expect(pages.length).toBeGreaterThanOrEqual(2);
    expect(apis.length).toBeGreaterThanOrEqual(3);
    for (const f of [...pages, ...apis]) expect(read(f), f).toMatch(/getCurrentUser\(\)/);
    expect(read("app/api/cron/drills/route.ts")).toMatch(/CRON_SECRET/);
  });

  it("copy stays warm: no rank, recruit or earn", () => {
    const copy = all.filter(READINESS_CODE);
    const offenders = copy.filter((f) => /\b(rank|recruit|earn)/i.test(read(f)));
    expect(offenders).toEqual([]);
  });

  it("gold is used only where it already was, for the Legend donation tier", () => {
    const allowed = ["components/passport/PassportTiers.tsx"];
    const offenders = all.filter((f) => !allowed.includes(f) && /#FFD700/i.test(read(f)));
    expect(offenders).toEqual([]);
  });
});
