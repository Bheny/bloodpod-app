import { createHmac, timingSafeEqual } from "node:crypto";

const BASE = "https://api.paystack.co";

/** Payments only switch on once both the secret key and the Care plan code are set. */
export function paymentsConfigured(): boolean {
  return Boolean(process.env.PAYSTACK_SECRET_KEY && process.env.PAYSTACK_CARE_PLAN_CODE);
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("Paystack is not configured");
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  const body = (await res.json().catch(() => null)) as { status?: boolean; message?: string; data?: T } | null;
  if (!res.ok || !body?.status || body.data === undefined) {
    throw new Error(body?.message ?? `Paystack request failed (${res.status})`);
  }
  return body.data;
}

export interface PaystackCharge {
  reference: string;
  status: string;
  amount: number;
  currency: string;
  customer?: { email?: string };
  plan?: { plan_code?: string } | null;
  metadata?: { userId?: string; kind?: string } | null;
}

export async function initializeSubscription(args: {
  email: string;
  reference: string;
  planCode: string;
  callbackUrl: string;
  userId: string;
}): Promise<{ authorization_url: string; reference: string }> {
  return call("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: args.email,
      reference: args.reference,
      plan: args.planCode, // the plan sets the amount and the monthly interval
      currency: "GHS",
      callback_url: args.callbackUrl,
      metadata: { userId: args.userId, kind: "CARE_SUBSCRIPTION" },
    }),
  });
}

export function verifyTransaction(reference: string): Promise<PaystackCharge> {
  return call(`/transaction/verify/${encodeURIComponent(reference)}`);
}

/** A one-time link where the subscriber can update their card or cancel. */
export async function subscriptionManageLink(subscriptionCode: string): Promise<string> {
  const data = await call<{ link: string }>(`/subscription/${encodeURIComponent(subscriptionCode)}/manage/link`);
  return data.link;
}

/** Paystack signs the raw request body with HMAC SHA512 using the secret key. */
export function validSignature(rawBody: string, signature: string | null): boolean {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key || !signature) return false;
  const expected = createHmac("sha512", key).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
