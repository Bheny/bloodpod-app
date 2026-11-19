import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { initializeSubscription, paymentsConfigured } from "@/lib/paystack";
import { getCareSubscription } from "@/lib/billing";
import { PRICING } from "@/lib/pricing";

/** Starts a Care subscription checkout and returns the Paystack page to send the person to. */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!paymentsConfigured()) {
    return NextResponse.json({ error: "Payments aren't switched on yet. Please check back soon." }, { status: 503 });
  }

  // Never start a second subscription while one is still running.
  const current = await getCareSubscription(user.id);
  if (current && current.status === "ACTIVE" && current.currentPeriodEnd > new Date()) {
    return NextResponse.json({ error: "You already have an active Care plan." }, { status: 409 });
  }

  const reference = `bp_${randomUUID().replace(/-/g, "")}`;
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const init = await initializeSubscription({
      email: user.email,
      reference,
      planCode: PRICING.CARE.paystackPlanCode!,
      callbackUrl: `${base}/upgrade/done`,
      userId: user.id,
    });
    await prisma.payment.create({
      data: {
        userId: user.id,
        amountPesewas: PRICING.CARE.pesewas,
        kind: "CARE_SUBSCRIPTION",
        paystackReference: reference,
      },
    });
    return NextResponse.json({ url: init.authorization_url });
  } catch (err) {
    console.error("[billing] checkout failed", err);
    return NextResponse.json({ error: "Couldn't start checkout. Please try again." }, { status: 502 });
  }
}
