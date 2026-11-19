import { NextResponse } from "next/server";
import { validSignature, type PaystackCharge } from "@/lib/paystack";
import { applySuccessfulCharge, attachSubscriptionCode, setStatusByCode } from "@/lib/billing";

interface WebhookEvent {
  event: string;
  data: PaystackCharge & {
    subscription_code?: string;
    next_payment_date?: string;
    customer?: { email?: string };
    subscription?: { subscription_code?: string };
  };
}

/** Public endpoint for Paystack. Trusts nothing until the signature checks out. */
export async function POST(request: Request) {
  const raw = await request.text();
  if (!validSignature(raw, request.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ error: "Bad signature" }, { status: 401 });
  }

  let evt: WebhookEvent;
  try {
    evt = JSON.parse(raw) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: "Bad body" }, { status: 400 });
  }

  try {
    switch (evt.event) {
      case "charge.success":
        // Only recurring-plan charges are ours; anything else is ignored.
        if (evt.data.plan?.plan_code || evt.data.metadata?.kind === "CARE_SUBSCRIPTION") {
          await applySuccessfulCharge(evt.data);
        }
        break;
      case "subscription.create":
        if (evt.data.subscription_code && evt.data.customer?.email) {
          await attachSubscriptionCode(evt.data.customer.email, evt.data.subscription_code, evt.data.next_payment_date);
        }
        break;
      case "invoice.payment_failed": {
        const code = evt.data.subscription?.subscription_code;
        if (code) await setStatusByCode(code, "PAST_DUE");
        break;
      }
      case "subscription.disable":
      case "subscription.not_renew":
        if (evt.data.subscription_code) await setStatusByCode(evt.data.subscription_code, "CANCELLED");
        break;
    }
  } catch (err) {
    // A 500 makes Paystack retry, which is what we want for a transient database error.
    console.error("[paystack webhook]", evt.event, err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
