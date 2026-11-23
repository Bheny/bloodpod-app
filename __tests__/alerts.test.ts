import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { BloodType } from "@prisma/client";
import {
  ALERT,
  canBeAsked,
  cleanAlertInput,
  comingCount,
  donorTypesFor,
  effectiveStatus,
  expiryFor,
  isLive,
  mentionsPayment,
  pickNearby,
  requesterView,
  responderView,
  secondsToFirstYes,
  shouldWiden,
  widenAtFor,
  type Askable,
} from "@/lib/alert-rules";
import { isBloodType } from "@/lib/blood-type";

const NOW = new Date("2026-11-27T12:00:00Z");
const min = (n: number) => new Date(NOW.getTime() + n * 60_000);

const donor = (over: Partial<Askable> = {}): Askable => ({
  id: "u1",
  onboardingComplete: true,
  isAvailable: true,
  isEligible: true,
  nextEligible: null,
  bloodType: BloodType.O_POS,
  hospitalId: null,
  labId: null,
  ...over,
});

describe("alerts: who can safely give", () => {
  it("lists every type that can give to the one needed", () => {
    expect(donorTypesFor(BloodType.A_POS).sort()).toEqual([BloodType.A_NEG, BloodType.A_POS, BloodType.O_NEG, BloodType.O_POS].sort());
    expect(donorTypesFor(BloodType.O_NEG).sort()).toEqual([BloodType.O_NEG]);
    // AB+ can receive from everyone.
    expect(donorTypesFor(BloodType.AB_POS)).toHaveLength(8);
  });
});

describe("alerts: who may be asked", () => {
  it("asks a ready, compatible donor", () => {
    expect(canBeAsked(donor(), BloodType.A_POS, NOW)).toBe(true);
  });
  it("leaves out someone who paused alerts", () => {
    expect(canBeAsked(donor({ isAvailable: false }), BloodType.A_POS, NOW)).toBe(false);
  });
  it("leaves out someone who cannot give yet, and someone not eligible", () => {
    expect(canBeAsked(donor({ nextEligible: min(60 * 24) }), BloodType.A_POS, NOW)).toBe(false);
    expect(canBeAsked(donor({ isEligible: false }), BloodType.A_POS, NOW)).toBe(false);
  });
  it("asks someone whose wait is over", () => {
    expect(canBeAsked(donor({ nextEligible: min(-5) }), BloodType.A_POS, NOW)).toBe(true);
  });
  it("leaves out an incompatible type and a type nobody knows", () => {
    expect(canBeAsked(donor({ bloodType: BloodType.B_POS }), BloodType.A_POS, NOW)).toBe(false);
    expect(canBeAsked(donor({ bloodType: null }), BloodType.A_POS, NOW)).toBe(false);
  });
  it("never asks hospital or lab staff, or someone who has not finished joining", () => {
    expect(canBeAsked(donor({ hospitalId: "h" }), BloodType.A_POS, NOW)).toBe(false);
    expect(canBeAsked(donor({ labId: "l" }), BloodType.A_POS, NOW)).toBe(false);
    expect(canBeAsked(donor({ onboardingComplete: false }), BloodType.A_POS, NOW)).toBe(false);
  });
});

describe("alerts: widening to donors nearby", () => {
  const origin = { latitude: 5.6037, longitude: -0.187, city: "Accra" }; // Accra
  const at = (id: string, lat: number | null, lng: number | null, city: string | null = null) => ({ id, latitude: lat, longitude: lng, city });

  it("keeps people inside the radius, nearest first", () => {
    const got = pickNearby([at("far", 5.6037, 0.1), at("near", 5.61, -0.19), at("mid", 5.7, -0.19)], origin, new Set());
    expect(got.map((g) => g.id)).toEqual(["near", "mid"]);
  });
  it("never includes anyone already alerted or the requester", () => {
    const got = pickNearby([at("a", 5.61, -0.19), at("b", 5.62, -0.19)], origin, new Set(["a"]));
    expect(got.map((g) => g.id)).toEqual(["b"]);
  });
  it("is capped", () => {
    const many = Array.from({ length: ALERT.nearbyMax + 20 }, (_, i) => at(`u${i}`, 5.61, -0.19));
    expect(pickNearby(many, origin, new Set())).toHaveLength(ALERT.nearbyMax);
  });
  it("falls back to the same city when a position is missing", () => {
    const noPos = { latitude: null, longitude: null, city: "Accra" };
    const got = pickNearby([at("same", null, null, "accra"), at("other", null, null, "Kumasi")], noPos, new Set());
    expect(got.map((g) => g.id)).toEqual(["same"]);
  });
  it("puts people measured by distance before people matched only by city", () => {
    const got = pickNearby([at("city", null, null, "Accra"), at("measured", 5.61, -0.19)], origin, new Set());
    expect(got.map((g) => g.id)).toEqual(["measured", "city"]);
  });
});

describe("alerts: when it widens", () => {
  const base = { status: "OPEN" as const, expiresAt: min(300), isTest: false, widenAt: min(-1), widenedAt: null };
  const nobody = [{ answer: null }, { answer: "CANT" as const }];

  it("widens once its time has come and nobody has said yes", () => {
    expect(shouldWiden(base, nobody, NOW)).toBe(true);
  });
  it("waits until its time", () => {
    expect(shouldWiden({ ...base, widenAt: min(3) }, nobody, NOW)).toBe(false);
  });
  it("never widens twice", () => {
    expect(shouldWiden({ ...base, widenedAt: min(-1) }, nobody, NOW)).toBe(false);
  });
  it("never widens a test", () => {
    expect(shouldWiden({ ...base, isTest: true }, nobody, NOW)).toBe(false);
  });
  it("does not widen when enough people already said yes", () => {
    const yes = Array.from({ length: ALERT.enoughYes }, () => ({ answer: "COMING" as const }));
    expect(shouldWiden(base, yes, NOW)).toBe(false);
    expect(shouldWiden(base, yes.slice(1), NOW)).toBe(true);
  });
  it("does not widen a closed or expired request", () => {
    expect(shouldWiden({ ...base, status: "FULFILLED" }, nobody, NOW)).toBe(false);
    expect(shouldWiden({ ...base, expiresAt: min(-1) }, nobody, NOW)).toBe(false);
  });
  it("critical widens soonest, and every request lasts longer than its wait", () => {
    expect(ALERT.widenAfterMinutes.CRITICAL).toBeLessThan(ALERT.widenAfterMinutes.URGENT);
    expect(ALERT.widenAfterMinutes.URGENT).toBeLessThan(ALERT.widenAfterMinutes.STANDARD);
    for (const u of ["CRITICAL", "URGENT", "STANDARD"] as const) {
      expect(expiryFor(u, NOW).getTime()).toBeGreaterThan(widenAtFor(u, NOW).getTime());
    }
  });
});

describe("alerts: status", () => {
  it("is open until closed or out of time", () => {
    expect(effectiveStatus({ status: "OPEN", expiresAt: min(10) }, NOW)).toBe("OPEN");
    expect(effectiveStatus({ status: "OPEN", expiresAt: min(-1) }, NOW)).toBe("EXPIRED");
    expect(effectiveStatus({ status: "FULFILLED", expiresAt: min(-1) }, NOW)).toBe("FULFILLED");
    expect(effectiveStatus({ status: "OPEN", expiresAt: null }, NOW)).toBe("OPEN");
  });
  it("only an open one is live", () => {
    expect(isLive({ status: "OPEN", expiresAt: min(5) }, NOW)).toBe(true);
    expect(isLive({ status: "CANCELLED", expiresAt: min(5) }, NOW)).toBe(false);
  });
});

describe("alerts: nobody pays for blood", () => {
  it("turns back talk of money, rewards and buying", () => {
    for (const t of ["I will pay GH₵200", "reward for the donor", "cash on arrival", "50 cedis", "ghs 100", "I can buy it", "incentive provided", "$20"]) {
      expect(mentionsPayment(t), t).toBe(true);
    }
  });
  it("lets an ordinary request through", () => {
    for (const t of ["Korle Bu Teaching Hospital", "Emergency ward, Accra", "Ask for the blood bank on the ground floor.", "My mother is going into surgery at 3pm"]) {
      expect(mentionsPayment(t), t).toBe(false);
    }
  });
  it("is checked on the hospital, the place and the note", () => {
    const base = { bloodType: "A_POS", urgency: "URGENT", facility: "Korle Bu", location: "", message: "" };
    expect(cleanAlertInput(base, isBloodType).ok).toBe(true);
    expect(cleanAlertInput({ ...base, message: "will pay well" }, isBloodType).ok).toBe(false);
    expect(cleanAlertInput({ ...base, location: "reward offered" }, isBloodType).ok).toBe(false);
    expect(cleanAlertInput({ ...base, facility: "cash only clinic" }, isBloodType).ok).toBe(false);
  });
});

describe("alerts: what a request must say", () => {
  const ok = { bloodType: "O_NEG", urgency: "CRITICAL", facility: "37 Military Hospital", location: "A&E", message: "Please hurry" };
  it("accepts a good request and trims it", () => {
    const r = cleanAlertInput({ ...ok, facility: "  37 Military Hospital  " }, isBloodType);
    expect(r.ok && r.value.facility).toBe("37 Military Hospital");
  });
  it("rejects a missing or unknown blood type, urgency or place", () => {
    expect(cleanAlertInput({ ...ok, bloodType: "X" }, isBloodType).ok).toBe(false);
    expect(cleanAlertInput({ ...ok, bloodType: undefined }, isBloodType).ok).toBe(false);
    expect(cleanAlertInput({ ...ok, urgency: "WHENEVER" }, isBloodType).ok).toBe(false);
    expect(cleanAlertInput({ ...ok, facility: " " }, isBloodType).ok).toBe(false);
  });
  it("cuts anything over the limits", () => {
    const r = cleanAlertInput({ ...ok, message: "a".repeat(1000), facility: "b".repeat(500) }, isBloodType);
    expect(r.ok && r.value.message?.length).toBe(ALERT.messageMax);
    expect(r.ok && r.value.facility.length).toBe(ALERT.facilityMax);
  });
});

describe("alerts: who sees whose number", () => {
  const person = { name: "Kofi Mensah", phone: "0244000111" };
  it("the person who asked sees a name and number only for a yes", () => {
    expect(responderView({ answer: "COMING" }, person)).toMatchObject({ fullName: "Kofi Mensah", phone: "0244000111" });
    for (const answer of ["CANT", null] as const) {
      const v = responderView({ answer }, person);
      expect(v.phone).toBeUndefined();
      expect(v.fullName).toBeUndefined();
      expect(v.firstName).toBe("Kofi");
    }
  });
  it("a donor sees the requester's number only after saying yes", () => {
    expect(requesterView({ answer: "COMING" }, person).phone).toBe("0244000111");
    expect(requesterView({ answer: "CANT" }, person).phone).toBeNull();
    expect(requesterView({ answer: null }, person).phone).toBeNull();
    expect(requesterView({ answer: null }, person).firstName).toBe("Kofi");
  });
});

describe("alerts: timing", () => {
  it("measures time to the first yes, ignoring no and silence", () => {
    const created = NOW;
    expect(secondsToFirstYes(created, [])).toBeNull();
    expect(secondsToFirstYes(created, [{ answer: "CANT", answeredAt: min(1) }, { answer: null, answeredAt: null }])).toBeNull();
    expect(secondsToFirstYes(created, [{ answer: "COMING", answeredAt: min(5) }, { answer: "COMING", answeredAt: min(2) }])).toBe(120);
  });
  it("counts yes answers", () => {
    expect(comingCount([{ answer: "COMING" }, { answer: "CANT" }, { answer: null }, { answer: "COMING" }])).toBe(2);
  });
});

describe("alerts: the promises in the code", () => {
  const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
  const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  const alerts = strip(read("lib/alerts.ts"));

  it("widening and closing are claimed in the database, so a double tap acts once", () => {
    expect(alerts).toMatch(/updateMany\(\{ where: \{ id: requestId, widenedAt: null \}/);
    expect(alerts).toMatch(/updateMany\(\{ where: \{ id: requestId, status: "OPEN" \}/);
  });

  it("a notification never carries a phone number", () => {
    const sender = alerts.slice(alerts.indexOf("async function notify"), alerts.indexOf("async function addRecipients"));
    expect(sender.length).toBeGreaterThan(100);
    expect(sender).not.toMatch(/phone/i);
  });

  it("only people who were alerted can see a request, not everyone of the same blood type", () => {
    const list = strip(read("lib/emergencies.ts"));
    expect(list).toMatch(/bloodRequestRecipient\.findMany/);
    expect(list).not.toMatch(/bloodRequest\.findMany/);
  });

  it("only listed donors who have alerts on are widened to", () => {
    const widen = alerts.slice(alerts.indexOf("export async function widenAlert"), alerts.indexOf("export async function widenDueAlerts"));
    expect(widen).toMatch(/isPublic: true/);
    expect(widen).toMatch(/isAvailable: true/);
    expect(widen).toMatch(/hospitalId: null/);
  });

  it("a test never reaches strangers and only an admin can send one", () => {
    expect(alerts).toMatch(/test && !isAdminEmail\(user\.email\)/);
    expect(alerts).toMatch(/req\.isTest \|\| !isLive/);
  });

  it("the form tells people blood is never paid for", () => {
    expect(read("components/alerts/RequestForm.tsx")).toMatch(/never bought, sold or paid for/);
    expect(read("components/alerts/AnswerPanel.tsx")).toMatch(/Nobody is ever paid for giving blood/);
  });
});
