import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getCareSubscription } from "@/lib/billing";
import { subscriptionManageLink } from "@/lib/paystack";

/** Returns a one-time Paystack link to update the card or cancel the subscription. */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sub = await getCareSubscription(user.id);
  if (!sub?.paystackSubscriptionCode) {
    return NextResponse.json({ error: "No subscription to manage yet." }, { status: 404 });
  }
  try {
    return NextResponse.json({ url: await subscriptionManageLink(sub.paystackSubscriptionCode) });
  } catch (err) {
    console.error("[billing] manage link failed", err);
    return NextResponse.json({ error: "Couldn't open subscription settings. Try again." }, { status: 502 });
  }
}
