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
    // Adding a feature here is a deliberate product decision: it must be a tool, never reach.
    const allowed: Feature[] = [
      "care_dashboard",
      "donor_rota",
      "family_blood_card",
      "medical_id",
      "donor_reminders",
      "request_tracker",
      "saved_searches",
      "pod_reminders",
      "donation_export",
      "dependant_cards",
      "family_contacts_notify",
      "second_manager",
    ];
    expect([...all].sort()).toEqual([...allowed].sort());
  });

  it("Plus includes everything in Basic, and Care and Case never need either", () => {
    for (const f of PLAN_FEATURES.BASIC) expect(PLAN_FEATURES.PLUS).toContain(f);
    expect(PLAN_FEATURES.PLUS.length).toBeGreaterThan(PLAN_FEATURES.BASIC.length);
    // Care and Case planning tools are not part of Basic or Plus: they are separate packages.
    for (const f of ["care_dashboard", "donor_rota", "donor_reminders"] as const) {
      expect(PLAN_FEATURES.BASIC).not.toContain(f);
      expect(PLAN_FEATURES.PLUS).not.toContain(f);
    }
    expect(PLAN_FEATURES.CARE).toEqual(PLAN_FEATURES.CASE);
  });

  it("a plan only ever adds tools: Free has none, and the same plan gives the same tools to everyone", () => {
    expect(PLAN_FEATURES.FREE).toEqual([]);
    const live = (plan: "BASIC" | "PLUS"): EntitlementSubject => ({
      subscriptions: [{ plan, status: "ACTIVE", currentPeriodEnd: new Date(Date.now() + 864e5) }],
    });
    expect(can(live("BASIC"), "request_tracker")).toBe(true);
    expect(can(live("BASIC"), "dependant_cards")).toBe(false);
    expect(can(live("PLUS"), "dependant_cards")).toBe(true);
    expect(can(live("PLUS"), "care_dashboard")).toBe(false);
    expect(can(free, "request_tracker")).toBe(false);
  });

  it("an ended plan stops giving tools", () => {
    const ended: EntitlementSubject = {
      subscriptions: [{ plan: "PLUS", status: "CANCELLED", currentPeriodEnd: new Date(Date.now() - 864e5) }],
    };
    expect(can(ended, "dependant_cards")).toBe(false);
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
      if (/^(app\/(\(app\)\/)?(care|settings|plans)|app\/api\/(care|paystack|billing|cron\/care-reminders)|lib\/(care|billing|paystack|entitlements|plan-access))/.test(f)) return false;
      return /\bcan\(/.test(read(join(ROOT, f)));
    });
    expect(offenders).toEqual([]);
  });

  it("no cash or airtime per donation", () => {
    const hits = files.filter((f) => /airtime|cashReward|payPerDonation/i.test(read(join(ROOT, f))));
    expect(hits).toEqual([]);
  });
});
