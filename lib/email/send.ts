import { after } from "next/server";
import { Resend } from "resend";

/**
 * The one place that talks to Resend.
 *
 * Email is a nice-to-have on every flow it touches: a missing key, an unverified domain or a Resend
 * outage must never fail a sign-up, a booking or a payment. So nothing here throws, and with no
 * RESEND_API_KEY it quietly does nothing (and says so once in the logs).
 */

let client: Resend | null = null;
let warned = false;

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (!warned) {
      warned = true;
      console.warn("[email] RESEND_API_KEY is not set, so no email will be sent.");
    }
    return null;
  }
  client ??= new Resend(key);
  return client;
}

export function appUrl(path = "") {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path}`;
}

/** "BloodPod <hello@mail.example.com>". Until the domain is verified, Resend's test sender works for your own address only. */
function sender() {
  return process.env.EMAIL_FROM ?? "BloodPod <onboarding@resend.dev>";
}

export interface OutgoingEmail {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  /** Same key twice = one email. Use one per event, so a retried request never sends twice. */
  idempotencyKey?: string;
  replyTo?: string;
}

/** Returns true when Resend accepted it. Never throws. */
export async function sendEmail(mail: OutgoingEmail): Promise<boolean> {
  const resend = getClient();
  if (!resend) return false;

  const to = (Array.isArray(mail.to) ? mail.to : [mail.to]).filter(Boolean);
  if (to.length === 0) return false;

  try {
    const { data, error } = await resend.emails.send(
      {
        from: sender(),
        to,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        replyTo: mail.replyTo ?? process.env.EMAIL_REPLY_TO,
      },
      mail.idempotencyKey ? { idempotencyKey: mail.idempotencyKey } : undefined,
    );
    if (error) {
      console.error("[email] Resend rejected", mail.subject, error.name, error.message);
      return false;
    }
    console.log("[email] sent", mail.subject, data?.id);
    return true;
  } catch (err) {
    console.error("[email] send failed", mail.subject, err);
    return false;
  }
}

/**
 * Runs the send after the response has gone out, so the person is not kept waiting on Resend.
 * Outside a request (a script or a test) it just runs.
 */
export function deferEmail(task: () => Promise<unknown>) {
  const safe = () => task().catch((err) => console.error("[email] task failed", err));
  try {
    after(safe);
  } catch {
    void safe();
  }
}
