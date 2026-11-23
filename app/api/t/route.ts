import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin/auth";
import {
  cleanCampaign,
  cleanCountry,
  decodeCity,
  deviceOf,
  isBot,
  isCleanId,
  normalizePath,
  sourceOf,
} from "@/lib/analytics";

export const dynamic = "force-dynamic";

const done = () => new NextResponse(null, { status: 204 });

// A double fire (a quick re-render, a retry) inside a few seconds is one view. Best effort: it is per server instance.
const recent = new Map<string, number>();
const WINDOW_MS = 4_000;

function repeated(key: string): boolean {
  const now = Date.now();
  if (recent.size > 5_000) for (const [k, t] of recent) if (now - t > WINDOW_MS) recent.delete(k);
  const last = recent.get(key);
  recent.set(key, now);
  return last !== undefined && now - last < WINDOW_MS;
}

/**
 * Records one page view for the admin Analytics page. Always answers 204 and never explains a refusal,
 * so it gives nothing away and the page never waits on it. See lib/analytics.ts for what is and is not kept.
 */
export async function POST(request: NextRequest) {
  try {
    const ua = request.headers.get("user-agent");
    if (isBot(ua)) return done();

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== "object") return done();

    const path = normalizePath(String(body.p ?? ""));
    if (!path || !isCleanId(body.v) || !isCleanId(body.s)) return done();
    if (repeated(`${body.v}${path}`)) return done();

    const entry = body.n === true;
    const source = entry
      ? sourceOf({
          referrer: typeof body.r === "string" ? body.r.slice(0, 300) : null,
          utmSource: typeof body.us === "string" ? body.us : null,
          ownHost: request.headers.get("host"),
        })
      : null;
    const campaign = entry ? cleanCampaign(typeof body.uc === "string" ? body.uc : null) : null;

    // Who is signed in. getClaims checks the token locally, so this adds no call to Supabase.
    let supabaseId: string | null = null;
    const hasSession = request.cookies.getAll().some((c) => c.name.includes("auth-token"));
    if (hasSession) {
      const supabase = await createClient();
      const { data } = await supabase.auth.getClaims();
      supabaseId = data?.claims?.sub ?? null;
      // The founder clicking around should not count as a visitor.
      if (isAdminEmail(data?.claims?.email as string | undefined)) return done();
    }

    const id = crypto.randomUUID();
    const country = cleanCountry(request.headers.get("x-vercel-ip-country"));
    const city = decodeCity(request.headers.get("x-vercel-ip-city"));

    await prisma.$executeRaw`
      INSERT INTO "PageView" ("id", "visitorId", "sessionId", "userId", "path", "entry", "source", "campaign", "device", "installed", "country", "city")
      VALUES (
        ${id}, ${body.v as string}, ${body.s as string},
        (SELECT "id" FROM "User" WHERE "supabaseId" = ${supabaseId}),
        ${path}, ${entry}, ${source}, ${campaign}, ${deviceOf(ua)}, ${body.i === true}, ${country}, ${city}
      )`;
  } catch {
    // Measuring must never break anything.
  }
  return done();
}
