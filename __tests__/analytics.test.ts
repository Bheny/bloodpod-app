import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cleanCountry, decodeCity, deviceOf, isBot, isCleanId, normalizePath, sourceOf } from "@/lib/analytics";

describe("analytics: what a path is allowed to say", () => {
  it("never keeps the query string or hash", () => {
    expect(normalizePath("/pod?token=secret&x=1")).toBe("/pod");
    expect(normalizePath("/discover#top")).toBe("/discover");
  });

  it("replaces invitation and share links entirely", () => {
    expect(normalizePath("/invite/AbC123xyZ9")).toBe("/invite/:code");
    expect(normalizePath("/invite/anything/else")).toBe("/invite/:code");
  });

  it("replaces ids with a placeholder but keeps words", () => {
    expect(normalizePath("/care/clx8k2m9a0000abcd1234efgh")).toBe("/care/:id");
    expect(normalizePath("/pod/ready")).toBe("/pod/ready");
    expect(normalizePath("/garden/12345")).toBe("/garden/:id");
  });

  it("is cut to three levels", () => {
    expect(normalizePath("/a/b/c/d/e")).toBe("/a/b/c");
  });

  it("does not record the admin area, the api, or things that are not paths", () => {
    expect(normalizePath("/admin")).toBeNull();
    expect(normalizePath("/admin/users")).toBeNull();
    expect(normalizePath("/api/t")).toBeNull();
    expect(normalizePath("//evil.com")).toBeNull();
    expect(normalizePath("https://x.com")).toBeNull();
    expect(normalizePath("/" + "a".repeat(300))).toBeNull();
  });

  it("the home page is just /", () => {
    expect(normalizePath("/")).toBe("/");
  });
});

describe("analytics: sources", () => {
  const own = "bloodpod.app";
  it("prefers the utm_source a sender chose", () => {
    expect(sourceOf({ utmSource: "WhatsApp", referrer: "https://google.com/", ownHost: own })).toBe("whatsapp");
  });
  it("names the big referrers and trims the rest to a host", () => {
    expect(sourceOf({ referrer: "https://www.google.com.gh/search?q=x", ownHost: own })).toBe("google");
    expect(sourceOf({ referrer: "https://l.facebook.com/l.php?u=1", ownHost: own })).toBe("facebook");
    expect(sourceOf({ referrer: "https://www.example.org/page?id=7", ownHost: own })).toBe("example.org");
  });
  it("counts our own site and no referrer as direct", () => {
    expect(sourceOf({ referrer: "https://www.bloodpod.app/pod", ownHost: own })).toBeNull();
    expect(sourceOf({ referrer: "", ownHost: own })).toBeNull();
    expect(sourceOf({ referrer: "not a url", ownHost: own })).toBeNull();
  });
  it("never keeps a path or query from the referrer", () => {
    const s = sourceOf({ referrer: "https://news.site/story/with-secret?x=1", ownHost: own });
    expect(s).toBe("news.site");
  });
});

describe("analytics: who counts", () => {
  it("tells devices apart", () => {
    expect(deviceOf("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148")).toBe("mobile");
    expect(deviceOf("Mozilla/5.0 (Linux; Android 14; Pixel 8) Mobile Safari")).toBe("mobile");
    expect(deviceOf("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)")).toBe("tablet");
    expect(deviceOf("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120")).toBe("desktop");
  });
  it("leaves out bots and link previews", () => {
    expect(isBot("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(true);
    expect(isBot("WhatsApp/2.23.20 A")).toBe(true);
    expect(isBot(undefined)).toBe(true);
    expect(isBot("Mozilla/5.0 (Windows NT 10.0) Chrome/120 Safari/537.36")).toBe(false);
  });
  it("only accepts ids in the shape the browser makes", () => {
    expect(isCleanId("3f2b8c1e-4d5a-4b6c-8d7e-9f0a1b2c3d4e")).toBe(true);
    expect(isCleanId("short")).toBe(false);
    expect(isCleanId("<script>alert(1)</script>")).toBe(false);
    expect(isCleanId(42)).toBe(false);
  });
  it("reads edge headers safely", () => {
    expect(cleanCountry("gh")).toBe("GH");
    expect(cleanCountry("Ghana")).toBeNull();
    expect(decodeCity("Cape%20Coast")).toBe("Cape Coast");
    expect(decodeCity("%E0%A4%A")).toBeNull();
  });
});

describe("analytics: the promises in the privacy policy", () => {
  const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  const route = strip(readFileSync(join(process.cwd(), "app/api/t/route.ts"), "utf8"));
  const tracker = strip(readFileSync(join(process.cwd(), "components/analytics/Tracker.tsx"), "utf8"));

  it("the endpoint never stores an IP address or the user agent", () => {
    // The user agent is read to pick a device and filter bots, and must not reach the INSERT.
    const insert = route.slice(route.indexOf("INSERT INTO"));
    expect(insert).not.toContain("${ua}");
    expect(route).not.toMatch(/x-forwarded-for|x-real-ip/i);
  });

  it("the browser honours Do Not Track and Global Privacy Control", () => {
    expect(tracker).toMatch(/doNotTrack/);
    expect(tracker).toMatch(/globalPrivacyControl/);
  });

  it("the browser never sends the query string or what is typed", () => {
    expect(tracker).not.toMatch(/\.value\b|addEventListener\(["'](input|keydown|keyup)/);
    expect(tracker).not.toMatch(/location\.href|\bsearch:/);
  });

  it("the admin area is never tracked", () => {
    expect(tracker).toMatch(/startsWith\("\/admin"\)/);
    expect(normalizePath("/admin/analytics")).toBeNull();
  });

  it("the retention in the policy is the one the cron enforces", () => {
    const policy = readFileSync(join(process.cwd(), "app/privacy/page.tsx"), "utf8");
    expect(policy).toMatch(/13 months/);
    const cron = readFileSync(join(process.cwd(), "app/api/cron/analytics-prune/route.ts"), "utf8");
    expect(cron).toMatch(/RETENTION_DAYS/);
  });
});
