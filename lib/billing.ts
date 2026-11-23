import { prisma } from "@/lib/prisma";
import { PRICING } from "@/lib/pricing";
import type { PaystackCharge } from "@/lib/paystack";
import { emailPaymentReceipt } from "@/lib/email/notify";

const PERIOD_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

async function findUserId(charge: PaystackCharge): Promise<string | null> {
  const fromMeta = charge.metadata?.userId;
  if (fromMeta) {
    const u = await prisma.user.findUnique({ where: { id: fromMeta }, select: { id: true } });
    if (u) return u.id;
  }
  // Renewal charges carry no metadata, so match on the paying email.
  const email = charge.customer?.email;
  if (!email) return null;
  const u = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } }, select: { id: true } });
  return u?.id ?? null;
}

/**
 * Applies a successful Care charge. Safe to call twice for the same reference
 * (the return page and the webhook both do): the Payment row is the guard, and
 * access runs to max(current end, now + 30 days), so a repeat never stacks time.
 */
export async function applySuccessfulCharge(charge: PaystackCharge): Promise<{ userId: string } | null> {
  if (charge.status !== "success" || charge.currency !== "GHS") return null;
  const userId = await findUserId(charge);
  if (!userId) return null;

  const already = await prisma.payment.findUnique({ where: { paystackReference: charge.reference } });
  if (already?.status === "SUCCEEDED") return { userId };

  const now = new Date();
  const newEnd = new Date(now.getTime() + PERIOD_DAYS * DAY_MS);

  await prisma.$transaction(async (tx) => {
    await tx.payment.upsert({
      where: { paystackReference: charge.reference },
      create: {
        userId,
        amountPesewas: charge.amount,
        currency: "GHS",
        kind: "CARE_SUBSCRIPTION",
        paystackReference: charge.reference,
        status: "SUCCEEDED",
      },
      update: { status: "SUCCEEDED", amountPesewas: charge.amount },
    });

    const existing = await tx.subscription.findFirst({
      where: { userId, plan: "CARE" },
      orderBy: { createdAt: "desc" },
    });
    if (existing) {
      await tx.subscription.update({
        where: { id: existing.id },
        data: {
          status: "ACTIVE",
          currentPeriodEnd: existing.currentPeriodEnd > newEnd ? existing.currentPeriodEnd : newEnd,
        },
      });
    } else {
      await tx.subscription.create({ data: { userId, plan: "CARE", status: "ACTIVE", currentPeriodEnd: newEnd } });
    }
  });

  // The early return above means a repeat (return page, then webhook) never sends a second receipt.
  const payer = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
  if (payer?.email) {
    emailPaymentReceipt({
      to: payer.email,
      reference: charge.reference,
      name: payer.name,
      amountPesewas: charge.amount,
      planName: "the Care Pod",
      periodEnd: newEnd,
    });
  }

  return { userId };
}

/** Records the Paystack subscription code so the person can manage or cancel it later. */
export async function attachSubscriptionCode(email: string, code: string, nextPayment?: string | null) {
  const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } }, select: { id: true } });
  if (!user) return;
  const existing = await prisma.subscription.findFirst({
    where: { userId: user.id, plan: "CARE" },
    orderBy: { createdAt: "desc" },
  });
  const end = nextPayment && !Number.isNaN(Date.parse(nextPayment)) ? new Date(nextPayment) : null;
  if (existing) {
    await prisma.subscription.update({
      where: { id: existing.id },
      data: {
        paystackSubscriptionCode: code,
        ...(end && end > existing.currentPeriodEnd ? { currentPeriodEnd: end } : {}),
      },
    });
  } else {
    // subscription.create can land before charge.success; the charge will extend this.
    await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: "CARE",
        status: "ACTIVE",
        currentPeriodEnd: end ?? new Date(),
        paystackSubscriptionCode: code,
      },
    });
  }
}

/** Failed or cancelled plans keep access until currentPeriodEnd, then lapse. */
export async function setStatusByCode(code: string, status: "PAST_DUE" | "CANCELLED") {
  await prisma.subscription.updateMany({ where: { paystackSubscriptionCode: code }, data: { status } });
}

export async function getCareSubscription(userId: string) {
  return prisma.subscription.findFirst({
    where: { userId, plan: "CARE" },
    orderBy: { createdAt: "desc" },
  });
}

export const CARE_PRICE_PESEWAS = PRICING.CARE.pesewas;
