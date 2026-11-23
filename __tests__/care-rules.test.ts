import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  askLimit,
  canNotify,
  canSeeCondition,
  daysUntilEligible,
  donorAskView,
  donorReminderDue,
  eligibleOnDate,
  familyReminderDue,
  nextDateAfter,
  rotaCounts,
  rotaState,
  validDateRange,
} from "@/lib/care-rules";

const DAY = 86_400_000;
const now = new Date("2026-11-21T08:00:00Z");
const inDays = (n: number) => new Date(now.getTime() + n * DAY);

describe("eligibility on the transfusion date", () => {
  it("accepts compatible blood with no recent donation", () => {
    expect(eligibleOnDate({ bloodType: "O_NEG", nextEligible: null }, "A_POS", inDays(10))).toBe(true);
  });

  it("rejects incompatible blood and unknown blood", () => {
    expect(eligibleOnDate({ bloodType: "A_POS", nextEligible: null }, "O_NEG", inDays(10))).toBe(false);
    expect(eligibleOnDate({ bloodType: null, nextEligible: null }, "O_NEG", inDays(10))).toBe(false);
  });

  it("uses the date, not today, for the 3-month rule", () => {
    const donor = { bloodType: "O_POS" as const, nextEligible: inDays(30) };
    expect(eligibleOnDate(donor, "O_POS", inDays(10))).toBe(false);
    expect(eligibleOnDate(donor, "O_POS", inDays(30))).toBe(true);
    expect(eligibleOnDate(donor, "O_POS", inDays(60))).toBe(true);
  });

  it("counts days until a donor could give", () => {
    expect(daysUntilEligible({ bloodType: "O_POS", nextEligible: inDays(30) }, inDays(10))).toBe(20);
    expect(daysUntilEligible({ bloodType: "O_POS", nextEligible: inDays(5) }, inDays(10))).toBe(0);
  });
});

describe("rota counts and privacy", () => {
  const entries = [
    { status: "YES" as const },
    { status: "YES" as const },
    { status: "REQUESTED" as const },
    { status: "NO" as const },
    { status: "EXPIRED" as const },
  ];

  it("shows counts, and folds a No into asked", () => {
    expect(rotaCounts(entries)).toEqual({ asked: 5, yes: 2, waiting: 1 });
  });

  it("reports full, short and empty", () => {
    expect(rotaState(2, 2)).toBe("full");
    expect(rotaState(1, 2)).toBe("short");
    expect(rotaState(0, 2)).toBe("empty");
  });

  it("gives a donor the blood group, date, hospital and number needed, and nothing about the condition", () => {
    const view = donorAskView({
      bloodType: "B_POS",
      scheduledFor: inDays(5),
      donorsNeeded: 2,
      hospitalName: "Korle Bu",
      organisationName: null,
      ownerName: "Ama Boateng",
    });
    expect(Object.keys(view).sort()).toEqual(["askedBy", "bloodType", "donorsNeeded", "hospital", "scheduledFor"]);
    expect(view.askedBy).toBe("Ama");
    expect(view.hospital).toBe("Korle Bu");
  });

  it("shows the condition to the owner, and to others only when shared", () => {
    const priv = { ownerId: "o", conditionVisibility: "PRIVATE" as const };
    const shared = { ownerId: "o", conditionVisibility: "SHARED" as const };
    expect(canSeeCondition("o", priv)).toBe(true);
    expect(canSeeCondition("x", priv)).toBe(false);
    expect(canSeeCondition("x", shared)).toBe(true);
  });
});

describe("reminders", () => {
  const none = { remind3dSentAt: null, remind1dSentAt: null };

  it("sends the 3-day reminder in its window, once", () => {
    expect(donorReminderDue(now, inDays(3), none)).toBe("3d");
    expect(donorReminderDue(now, inDays(3), { ...none, remind3dSentAt: now })).toBeNull();
    expect(donorReminderDue(now, inDays(5), none)).toBeNull();
  });

  it("sends the 1-day reminder, and prefers it when a run was missed", () => {
    expect(donorReminderDue(now, inDays(1), none)).toBe("1d");
    expect(donorReminderDue(now, inDays(1), { ...none, remind3dSentAt: now })).toBe("1d");
    expect(donorReminderDue(now, inDays(1), { ...none, remind1dSentAt: now })).toBeNull();
  });

  it("sends nothing for a date that has passed", () => {
    expect(donorReminderDue(now, inDays(-1), none)).toBeNull();
  });

  it("warns the family 7 days out only when the rota is short, and only once", () => {
    const d = { scheduledFor: inDays(7), donorsNeeded: 2, completedAt: null, familyReminderSentAt: null };
    expect(familyReminderDue(now, d, 1)).toBe(true);
    expect(familyReminderDue(now, d, 2)).toBe(false);
    expect(familyReminderDue(now, { ...d, scheduledFor: inDays(8) }, 0)).toBe(false);
    expect(familyReminderDue(now, { ...d, familyReminderSentAt: now }, 0)).toBe(false);
    expect(familyReminderDue(now, { ...d, completedAt: now }, 0)).toBe(false);
  });

  it("limits how many donors a family can ask per date", () => {
    expect(askLimit(2)).toBe(6);
    expect(askLimit(10)).toBe(12);
  });

  it("respects 3 non-critical notifications a day", () => {
    expect(canNotify(2)).toBe(true);
    expect(canNotify(3)).toBe(false);
  });
});

describe("dates", () => {
  it("rolls the next date forward by the interval", () => {
    expect(nextDateAfter(new Date("2026-12-01T00:00:00Z"), 28).toISOString()).toBe("2026-12-29T00:00:00.000Z");
  });

  it("rejects past dates and far-off typos", () => {
    expect(validDateRange(inDays(10), now)).toBe(true);
    expect(validDateRange(inDays(-3), now)).toBe(false);
    expect(validDateRange(inDays(900), now)).toBe(false);
  });
});

describe("hard rules for Care Pod code", () => {
  it("a donor answering a request never depends on any plan", () => {
    const route = readFileSync(join(process.cwd(), "app/api/care/rota/[entryId]/route.ts"), "utf8");
    expect(route).not.toMatch(/entitlements|userCan|can\(/);

    const lib = readFileSync(join(process.cwd(), "lib/care.ts"), "utf8");
    const answer = lib.slice(lib.indexOf("export async function answerAsk"), lib.indexOf("// ── Reads"));
    expect(answer).not.toMatch(/userCan|can\(|subscription/);
  });

  it("who is eligible and who is asked never reads a plan", () => {
    const rules = readFileSync(join(process.cwd(), "lib/care-rules.ts"), "utf8");
    expect(rules).not.toMatch(/entitlements|SubscriptionPlan|subscription/i);
  });
});
