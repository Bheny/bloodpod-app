import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { can, PLAN_FEATURES, type EntitlementSubject, type Feature } from "@/lib/entitlements";
import { isPodFull, FREE_POD_MEMBER_LIMIT } from "@/lib/pod-limits";

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
const read = (p: string) => readFileSync(p, "utf8");

/** Code that sends alerts, lists donors or joins Pods. None of it may know about plans. */
const UNGATED = (p: string) =>
  /^app\/api\/(emergencies|invite|pod|pods|discover|activity)\//.test(p) ||
  /^app\/\(app\)\/(discover|pod|dashboard\/request)\//.test(p) ||
  /^app\/invite\//.test(p) ||
  /^lib\/(emergencies|pod-invite|pod-limits|pod-data|discover-data|invite|push)\.ts$/.test(p);

const files = [...walk(join(ROOT, "app")), ...walk(join(ROOT, "lib"))].map(rel);

const free: EntitlementSubject = { subscriptions: [] };
const paid: EntitlementSubject = {
  subscriptions: [{ plan: "CARE", status: "ACTIVE", currentPeriodEnd: new Date(Date.now() + 864e5) }],
};

describe("hard rules: no plan gates alerts, listing or Pod joining", () => {
  it("only planning tools are features", () => {
    const all = new Set(Object.values(PLAN_FEATURES).flat());
    const allowed: Feature[] = ["care_dashboard", "donor_rota", "family_blood_card", "medical_id", "donor_reminders"];
    expect([...all].sort()).toEqual([...allowed].sort());
  });

  it("no feature name refers to alerts, priority, listing or joining", () => {
    for (const f of Object.values(PLAN_FEATURES).flat()) {
      expect(f).not.toMatch(/alert|priority|listing|join|emergency/);
    }
  });

  it("free users get no paid feature and paid users get no extra reach", () => {
    expect(can(free, "care_dashboard")).toBe(false);
    expect(can(paid, "care_dashboard")).toBe(true);
  });

  it("Pod cap is the same for everyone", () => {
    expect(isPodFull.length).toBe(1);
    expect(isPodFull(FREE_POD_MEMBER_LIMIT - 1)).toBe(false);
    expect(isPodFull(FREE_POD_MEMBER_LIMIT)).toBe(true);
  });

  it("alert, listing and Pod-joining code never imports entitlements or reads a plan", () => {
    const offenders: string[] = [];
    for (const f of files.filter(UNGATED)) {
      const src = read(join(ROOT, f));
      if (/@\/lib\/(entitlements|pricing)/.test(src)) offenders.push(`${f}: imports entitlements/pricing`);
      if (/\.plan\b|\bplan\s*[:=!]=?=?\s*["']|SubscriptionPlan|prisma\.subscription\b/.test(src)) offenders.push(`${f}: reads a plan`);
    }
    expect(offenders).toEqual([]);
  });

  it("nothing outside care and billing code gates on can()", () => {
    const offenders = files.filter((f) => {
      if (f === "lib/entitlements.ts") return false;
      if (/^(app\/(\(app\)\/)?(care|settings|plans)|app\/api\/(care|paystack|billing)|lib\/(care|billing|paystack|entitlements))/.test(f)) return false;
      return /\bcan\(/.test(read(join(ROOT, f)));
    });
    expect(offenders).toEqual([]);
  });

  it("no cash or airtime per donation", () => {
    const hits = files.filter((f) => /airtime|cashReward|payPerDonation/i.test(read(join(ROOT, f))));
    expect(hits).toEqual([]);
  });
});
