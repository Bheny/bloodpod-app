/**
 * Pure helpers for BloodPod's own analytics. Nothing here touches the database or the request,
 * so the privacy rules (what is never stored) can be tested on their own.
 *
 * What is stored for a page view: a random visitor id, a visit id, the cleaned path, a coarse source,
 * device type, country and city (from the host's edge headers), and the signed-in user when there is one.
 * What is never stored: the IP address, the query string, the user agent, or anything typed on a page.
 */

/** Pages we never record. The admin area is the founder's own, and the API is not a page. */
const IGNORED_PREFIXES = ["/admin", "/api", "/_next", "/sw.js", "/manifest"];

/** Paths whose second segment is a secret or a one-off link: the whole thing becomes a placeholder. */
const OPAQUE_AFTER: Record<string, string> = {
  invite: ":code",
  passport: ":code",
  i: ":code",
  join: ":code",
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CUID = /^c[a-z0-9]{20,}$/;

/** A segment that is an id rather than a word: long, or mixing letters and digits. */
function looksLikeId(segment: string): boolean {
  if (UUID.test(segment) || CUID.test(segment)) return true;
  if (/^\d+$/.test(segment)) return true;
  if (segment.length >= 16) return true;
  return segment.length >= 8 && /\d/.test(segment) && /[a-z]/i.test(segment);
}

/**
 * The path as it will be stored, or null when it must not be recorded at all.
 * The query string and hash are dropped, ids and tokens are replaced, and it is cut to three levels.
 */
export function normalizePath(raw: string): string | null {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//")) return null;
  const clean = raw.split(/[?#]/)[0];
  if (clean.length > 200) return null;

  const lower = clean.toLowerCase();
  if (IGNORED_PREFIXES.some((p) => lower === p || lower.startsWith(`${p}/`))) return null;

  const segments = clean.split("/").filter(Boolean);
  if (segments.length === 0) return "/";

  const out: string[] = [];
  for (let i = 0; i < segments.length && out.length < 3; i++) {
    const seg = segments[i];
    if (i === 1 && OPAQUE_AFTER[segments[0].toLowerCase()]) {
      out.push(OPAQUE_AFTER[segments[0].toLowerCase()]);
      break;
    }
    out.push(i > 0 && looksLikeId(seg) ? ":id" : seg.toLowerCase().slice(0, 40));
  }
  return `/${out.join("/")}`;
}

/** Random ids come from the browser: accept only the shape we generate. */
export function isCleanId(v: unknown): v is string {
  return typeof v === "string" && /^[a-z0-9-]{8,40}$/i.test(v);
}

export type Device = "mobile" | "tablet" | "desktop";

export function deviceOf(userAgent: string | null | undefined): Device {
  const ua = userAgent ?? "";
  if (/ipad|tablet|playbook|silk/i.test(ua) || (/android/i.test(ua) && !/mobile/i.test(ua))) return "tablet";
  if (/mobi|iphone|ipod|android|windows phone|opera mini/i.test(ua)) return "mobile";
  return "desktop";
}

/** Crawlers and link-preview bots would otherwise count as visitors. */
export function isBot(userAgent: string | null | undefined): boolean {
  if (!userAgent) return true;
  return /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|curl|wget|python-requests|headless|lighthouse|pingdom|uptime|monitor|vercel-screenshot/i.test(
    userAgent,
  );
}

const SOURCE_NAMES: [RegExp, string][] = [
  [/(^|\.)google\./, "google"],
  [/(^|\.)bing\.com$/, "bing"],
  [/(^|\.)duckduckgo\.com$/, "duckduckgo"],
  [/(^|\.)(facebook|fb)\.com$|(^|\.)l\.facebook\.com$|^lm\.facebook\.com$/, "facebook"],
  [/(^|\.)instagram\.com$/, "instagram"],
  [/(^|\.)(twitter|x)\.com$|^t\.co$/, "x"],
  [/(^|\.)linkedin\.com$|^lnkd\.in$/, "linkedin"],
  [/(^|\.)(wa\.me|whatsapp\.com)$/, "whatsapp"],
  [/(^|\.)(t\.me|telegram\.org)$/, "telegram"],
  [/(^|\.)tiktok\.com$/, "tiktok"],
  [/(^|\.)youtube\.com$|^youtu\.be$/, "youtube"],
];

/**
 * Where a visit came from. A utm_source the sender chose wins, then the referring site,
 * and a visit with neither is direct (null). Visits that came from our own site are direct too.
 */
export function sourceOf(opts: { referrer?: string | null; utmSource?: string | null; ownHost?: string | null }): string | null {
  const utm = (opts.utmSource ?? "").trim().toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 40);
  if (utm) return utm;

  const ref = (opts.referrer ?? "").trim();
  if (!ref) return null;
  if (/^android-app:/i.test(ref)) return "app";

  let host: string;
  try {
    const url = new URL(ref);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    host = url.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
  if (!host) return null;

  const own = (opts.ownHost ?? "").toLowerCase().replace(/^www\./, "").split(":")[0];
  if (own && host === own) return null;

  for (const [re, name] of SOURCE_NAMES) if (re.test(host)) return name;
  return host.slice(0, 60);
}

export function cleanCampaign(v: string | null | undefined): string | null {
  const c = (v ?? "").trim().toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 40);
  return c || null;
}

/** Edge headers carry the city percent-encoded. Never throws. */
export function decodeCity(v: string | null | undefined): string | null {
  if (!v) return null;
  try {
    return decodeURIComponent(v).slice(0, 60) || null;
  } catch {
    return null;
  }
}

export function cleanCountry(v: string | null | undefined): string | null {
  return v && /^[A-Za-z]{2}$/.test(v) ? v.toUpperCase() : null;
}

/** How long page views are kept. Long enough for a year-on-year look, no longer. */
export const RETENTION_DAYS = 400;
