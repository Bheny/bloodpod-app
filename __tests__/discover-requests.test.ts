import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { canSeeContact, effectiveStatus, firstNameOf, personView, REQUEST_RULES, requestExpiry } from "@/lib/donor-requests-rules";

const NOW = new Date("2026-11-20T12:00:00Z");
const HOUR = 3_600_000;

const req = (status: "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED", expiresInHours = 24) => ({
  seekerId: "seeker",
  donorId: "donor",
  status,
  expiresAt: new Date(NOW.getTime() + expiresInHours * HOUR),
});

const donor = { name: "Kwame Mensah", phone: "+233244000111" };

describe("first names", () => {
  it("keeps only the first word", () => {
    expect(firstNameOf("Kwame Mensah")).toBe("Kwame");
    expect(firstNameOf("  Ama  ")).toBe("Ama");
    expect(firstNameOf("Kofi Annan Owusu")).toBe("Kofi");
  });

  it("is null when there is no name", () => {
    expect(firstNameOf(null)).toBeNull();
    expect(firstNameOf("   ")).toBeNull();
  });
});

describe("request lifetime", () => {
  it("a pending request lapses on its own once its time is up", () => {
    expect(effectiveStatus(req("PENDING", 1), NOW)).toBe("PENDING");
    expect(effectiveStatus(req("PENDING", 0), NOW)).toBe("EXPIRED");
    expect(effectiveStatus(req("PENDING", -5), NOW)).toBe("EXPIRED");
  });

  it("an answered request is never turned into an expired one", () => {
    expect(effectiveStatus(req("ACCEPTED", -100), NOW)).toBe("ACCEPTED");
    expect(effectiveStatus(req("DECLINED", -100), NOW)).toBe("DECLINED");
  });

  it("new requests last 48 hours", () => {
    expect(requestExpiry(NOW).getTime() - NOW.getTime()).toBe(48 * HOUR);
    expect(REQUEST_RULES.expiresHours).toBe(48);
  });
});

describe("who sees full details", () => {
  it("nobody, until the donor accepts", () => {
    for (const status of ["PENDING", "DECLINED", "CANCELLED"] as const) {
      expect(canSeeContact(req(status), "seeker", NOW)).toBe(false);
      expect(canSeeContact(req(status), "donor", NOW)).toBe(false);
    }
  });

  it("an expired request shares nothing", () => {
    expect(canSeeContact(req("PENDING", -1), "seeker", NOW)).toBe(false);
  });

  it("after the donor accepts, only the two people in the request", () => {
    expect(canSeeContact(req("ACCEPTED"), "seeker", NOW)).toBe(true);
    expect(canSeeContact(req("ACCEPTED"), "donor", NOW)).toBe(true);
    expect(canSeeContact(req("ACCEPTED"), "someone-else", NOW)).toBe(false);
  });

  it("before acceptance the other person is a first name and nothing else", () => {
    const view = personView(req("PENDING"), "seeker", donor, NOW);
    expect(view).toEqual({ firstName: "Kwame" });
    expect(JSON.stringify(view)).not.toMatch(/Mensah|0244|phone|fullName/);
  });

  it("after acceptance the seeker gets the full name and phone", () => {
    expect(personView(req("ACCEPTED"), "seeker", donor, NOW)).toEqual({
      firstName: "Kwame",
      fullName: "Kwame Mensah",
      phone: "+233244000111",
    });
  });

  it("a third person never gets more than a first name, even after acceptance", () => {
    expect(personView(req("ACCEPTED"), "stranger", donor, NOW)).toEqual({ firstName: "Kwame" });
  });

  it("limits are as agreed", () => {
    expect(REQUEST_RULES.openAtOnce).toBe(3);
    expect(REQUEST_RULES.perDay).toBe(10);
    expect(REQUEST_RULES.retryAfterDeclineDays).toBe(7);
  });
});

describe("what a Discover search can reveal", () => {
  const raw = readFileSync(join(process.cwd(), "lib/discover-data.ts"), "utf8");
  // Comments may say what is never shared; only the code itself must not touch it.
  const src = raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

  it("never reads a phone number or email", () => {
    expect(src).not.toMatch(/phone|email/i);
  });

  it("only ever returns a first name, never the stored full name", () => {
    expect(src).toMatch(/firstNameOf\(u\.name\)/);
    // The raw name is selected only to be shortened; it must not be copied into a result.
    expect(src).not.toMatch(/\bname:\s*u\.name/);
  });

  it("a first name and an ask id exist only for people who chose to be listed", () => {
    expect(src).toMatch(/firstName:\s*u\.isPublic\s*\?/);
    expect(src).toMatch(/askId:\s*u\.isPublic\s*&&/);
  });
});
