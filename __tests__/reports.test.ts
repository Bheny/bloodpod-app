import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { REASONS, REPORT, cleanReport, shouldHold } from "@/lib/report-rules";
import { OUTREACH_TEMPLATES, TEMPLATE_IDS, waNumber, whatsappUrl } from "@/lib/whatsapp";

const read = (p: string) => readFileSync(p, "utf8");

describe("reports: what a report must say", () => {
  it("needs a person and a reason", () => {
    expect(cleanReport({}).ok).toBe(false);
    expect(cleanReport({ userId: "u1" }).ok).toBe(false);
    expect(cleanReport({ userId: "u1", reason: "BOGUS" }).ok).toBe(false);
    expect(cleanReport({ userId: "", reason: "FAKE_DETAILS" }).ok).toBe(false);
  });

  it("accepts every listed reason", () => {
    for (const r of REASONS) expect(cleanReport({ userId: "u1", reason: r.id }).ok).toBe(true);
  });

  it("tidies and limits the note", () => {
    const res = cleanReport({ userId: "u1", reason: "OTHER", note: `  hello \n\n  there  ${"x".repeat(1000)}` });
    expect(res.ok && res.value.note?.startsWith("hello there")).toBe(true);
    expect(res.ok && res.value.note!.length).toBeLessThanOrEqual(REPORT.noteMax);
    const none = cleanReport({ userId: "u1", reason: "OTHER", note: "   " });
    expect(none.ok && none.value.note).toBeNull();
  });
});

describe("reports: pausing reach", () => {
  it("waits for several different people, not just one", () => {
    expect(shouldHold(0)).toBe(false);
    expect(shouldHold(REPORT.holdAt - 1)).toBe(false);
    expect(shouldHold(REPORT.holdAt)).toBe(true);
  });

  it("a held account is left out of listing, asking and raising requests", () => {
    expect(read("lib/alerts.ts")).toMatch(/where: \{ id: \{ in: ids \}, heldAt: null \}/);
    expect(read("lib/alerts.ts")).toMatch(/isPublic: true,\s+heldAt: null/);
    expect(read("lib/alerts.ts")).toContain("if (user.heldAt)");
    expect(read("lib/discover-data.ts")).toMatch(/heldAt: null/);
  });
});

describe("reports: protecting the people involved", () => {
  const src = read("lib/reports.ts");

  it("only lets you report someone you met through BloodPod, and caps reports per day", () => {
    expect(src).toContain("metThroughBloodPod");
    expect(src).toContain("REPORT.perDay");
    expect(src).toContain("You cannot report yourself");
  });

  it("answers the same way for a missing person, a stranger and staff", () => {
    expect(src.match(/We could not find that person\./g)?.length).toBe(2);
  });

  it("never sends a report to the person reported", () => {
    expect(src).not.toMatch(/sendPush|emailTo|queue\(|sendNow/);
  });

  it("the reporting route needs a signed-in person", () => {
    expect(read("app/api/reports/route.ts")).toContain("getCurrentUser");
  });

  it("the admin routes need an admin", () => {
    expect(read("app/api/admin/reports/route.ts")).toContain("requireAdminApi");
    expect(read("app/api/admin/outreach/route.ts")).toContain("requireAdminApi");
    expect(read("app/admin/reports/page.tsx")).toContain("requireAdmin");
  });

  it("the member-facing words promise the person is not told", () => {
    expect(read("components/reports/ReportButton.tsx")).toContain("never told who reported them");
  });
});

describe("whatsapp: opening a chat", () => {
  it("turns a Ghana number into international digits", () => {
    expect(waNumber("024 123 4567")).toBe("233241234567");
    expect(waNumber("+233 24 123 4567")).toBe("233241234567");
    expect(waNumber("00233241234567")).toBe("233241234567");
  });

  it("refuses numbers that cannot work", () => {
    expect(waNumber(null)).toBeNull();
    expect(waNumber("")).toBeNull();
    expect(waNumber("123")).toBeNull();
    expect(whatsappUrl("abc", "hi")).toBeNull();
  });

  it("builds a link with the message encoded", () => {
    expect(whatsappUrl("0241234567", "Hello there & welcome")).toBe("https://wa.me/233241234567?text=Hello%20there%20%26%20welcome");
  });
});

describe("whatsapp: the messages", () => {
  const all = OUTREACH_TEMPLATES.flatMap((t) => [t.text("Kofi"), t.text(null)]);

  it("has unique ids and a message for each", () => {
    expect(new Set(TEMPLATE_IDS).size).toBe(OUTREACH_TEMPLATES.length);
    for (const t of OUTREACH_TEMPLATES) {
      expect(t.text("Kofi")).toContain("Kofi");
      expect(t.text(null).startsWith("Hello,")).toBe(true);
    }
  });

  it("says who we are, so it is not mistaken for a scam", () => {
    for (const m of all) expect(m).toContain("BloodPod");
  });

  it("educates and never accuses or threatens", () => {
    const text = all.join("\n");
    expect(text).not.toMatch(/\b(fake|fraud|scam|liar|lying|banned|blocked|suspend|report(ed)?|police|legal|warning|punish)/i);
  });

  it("never asks for money, codes or passwords", () => {
    const text = all.join("\n");
    expect(text).not.toMatch(/\b(send (us )?money|mobile money|momo|password|pin|otp|verification code|transfer)\b/i);
  });

  it("states the no-payment rule in the only way it can be stated", () => {
    const rule = OUTREACH_TEMPLATES.find((t) => t.id === "no_payment")!.text("Ama");
    expect(rule).toContain("Nobody pays for it and nobody is paid for it");
  });

  it("is short enough to read in WhatsApp", () => {
    for (const m of all) expect(m.length).toBeLessThanOrEqual(480);
  });
});
