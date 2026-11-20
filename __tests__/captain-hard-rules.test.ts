import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { PLEDGE } from "@/lib/captain-config";

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

/** Everything that decides who is alerted, how loudly or in what order. A Captain's level has no say in any of it. */
const ALERT_CODE = (f: string) =>
  /^lib\/(push|emergencies|discover-data|pending-invites|activity)\.ts$/.test(f) ||
  /^app\/api\/(emergencies|push|discover)\//.test(f) ||
  /^app\/\(app\)\/(discover|dashboard\/request)\//.test(f) ||
  /^components\/dashboard\/(EmergencySlot|SendAlertButton)/.test(f);

/** Code in the Captain programme that picks recipients for a drill. */
const DRILL_RECIPIENTS = ["lib/captain/drill.ts"];

describe("captain hard rules", () => {
  it("alert code never reads a Captain level or imports Captain code", () => {
    const offenders: string[] = [];
    for (const f of all.filter(ALERT_CODE)) {
      const src = read(f);
      if (/captainLevel|captainStatus|approvedLevel|CaptainStatus/i.test(src)) offenders.push(`${f}: reads a Captain level`);
      if (/@\/lib\/captain/.test(src)) offenders.push(`${f}: imports Captain code`);
    }
    expect(offenders).toEqual([]);
  });

  it("drill recipient code never reads a Captain level either", () => {
    for (const f of DRILL_RECIPIENTS.filter((p) => existsSync(join(ROOT, p)))) {
      expect(read(f)).not.toMatch(/captainLevel|captainStatus|approvedLevel|CaptainStatus|computeCaptainLevel/i);
    }
  });

  it("no money, airtime or payment is tied to Captain levels", () => {
    const captainFiles = all.filter((f) => /captain/i.test(f));
    expect(captainFiles.length).toBeGreaterThan(0);
    const offenders: string[] = [];
    for (const f of captainFiles) {
      // The pledge itself says "payment", so take it out before looking.
      const src = read(f).split(PLEDGE).join("").replace(/PLEDGE\s*=\s*"[^"]*"/, "");
      if (/airtime|cashReward|cash\b|pesewas|paystack|GH₵|payout|bonus|commission|stipend/i.test(src)) offenders.push(f);
    }
    expect(offenders).toEqual([]);
  });

  it("the pledge says what it must", () => {
    expect(PLEDGE).toBe("I will never ask for, offer or accept payment for donating blood.");
  });

  it("Captain code never gates joining a Pod, or charges to be listed", () => {
    const joining = all.filter((f) => /^app\/api\/invite\/|^app\/invite\/|^lib\/(pod-invite|pod-limits)\.ts$/.test(f));
    for (const f of joining) expect(read(f)).not.toMatch(/captain/i);
  });

  it("the programme is behind its flag: pages, APIs and the nightly job all check it", () => {
    const pages = all.filter((f) => /^app\/\(app\)\/captain\/.*page\.tsx$/.test(f));
    const apis = all.filter((f) => /^app\/api\/captain\/.*route\.ts$/.test(f));
    expect(pages.length).toBeGreaterThanOrEqual(2);
    expect(apis.length).toBeGreaterThanOrEqual(4);
    for (const f of pages) expect(read(f), f).toMatch(/isCaptainEnabled\(\)/);
    for (const f of apis) expect(read(f), f).toMatch(/captainApi\(\)/);
    expect(read("app/api/cron/captain/route.ts")).toMatch(/isCaptainEnabled\(\)/);
  });

  it("existing screens only show Captain things when the flag is on", () => {
    for (const f of ["app/(app)/pod/[podId]/page.tsx", "app/(app)/profile/page.tsx"]) {
      expect(read(f), f).toMatch(/isCaptainEnabled\(\)/);
    }
  });

  it("copy stays warm: no rank, recruit or earn", () => {
    const copy = all.filter((f) => /^components\/captain\/|^app\/\(app\)\/captain\/|^lib\/email\/captain\.ts$/.test(f));
    expect(copy.length).toBeGreaterThan(0);
    const offenders = copy.filter((f) => /\b(rank|recruit|earn)/i.test(read(f)));
    expect(offenders).toEqual([]);
  });

  it("gold is used only for Captain badges", () => {
    // PassportTiers used gold for its Legend tier before the Captain programme existed.
    const before = ["components/passport/PassportTiers.tsx"];
    const offenders = all.filter((f) => !/captain/i.test(f) && !before.includes(f) && /#FFD700/i.test(read(f)));
    expect(offenders).toEqual([]);
  });
});
