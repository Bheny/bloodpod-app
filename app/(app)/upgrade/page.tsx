import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, Clock } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { getCareSubscription } from "@/lib/billing";
import { paymentsConfigured } from "@/lib/paystack";
import { formatPesewas, PRICING } from "@/lib/pricing";
import { FREE_OWNED_POD_LIMIT, PAID_OWNED_POD_LIMIT } from "@/lib/pod-limits";
import { formatDate } from "@/lib/formatters";
import { AppHeader } from "@/components/layout/AppHeader";
import { BillingButton } from "@/components/billing/BillingButton";
import { InterestButton } from "@/components/billing/InterestButton";

const COMING = [
  { title: "A donor rota", body: "Line up who gives for each transfusion date, so the next one is never a scramble." },
  { title: "Reminders", body: "Donors get a nudge before the day, so people turn up." },
  { title: "A Blood Card for your loved one", body: "Their blood type and details, ready to share with family or a hospital." },
  { title: "A medical ID", body: "The essentials a hospital needs in one place." },
];

export default async function UpgradePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user.hospitalId) redirect("/hospital");
  if (user.labId) redirect("/lab");
  if (!user.onboardingComplete) redirect("/onboarding");

  const [sub, interest] = await Promise.all([
    getCareSubscription(user.id),
    prisma.planInterest.findUnique({ where: { userId_plan: { userId: user.id, plan: "CARE" } }, select: { id: true } }),
  ]);
  const live = Boolean(sub && sub.status !== "EXPIRED" && sub.currentPeriodEnd > new Date());
  const ready = paymentsConfigured();
  const price = formatPesewas(PRICING.CARE.pesewas);

  return (
    <div>
      <AppHeader title="Care plan" subtitle="Planning help for families who need blood again and again" />

      <div className="flex flex-col gap-3.5 px-3.5 pb-8 pt-4 lg:max-w-xl lg:px-0 lg:pt-0">
        <section className="rounded-2xl border-[0.5px] border-hairline bg-card p-5 shadow-raised lg:p-6">
          <h2 className="text-title font-extrabold tracking-[-0.4px] text-ink">What is the Care plan?</h2>
          <p className="mt-2 text-body-sm leading-relaxed text-ink-mid">
            Some families need blood again and again. A child with sickle cell, for example, may need a transfusion
            every few weeks. Finding donors each time is stressful.
          </p>
          <p className="mt-2 text-body-sm leading-relaxed text-ink-mid">
            The Care plan helps your family plan ahead, so the people who give are lined up before the day comes.
          </p>

          <h3 className="mt-5 text-body-sm font-bold text-ink">You get today</h3>
          <ul className="mt-2 flex flex-col gap-2.5 text-body-sm text-ink">
            <li className="flex items-start gap-2.5">
              <Check className="mt-0.5 size-4 shrink-0 text-[#1FA855]" />
              Room for more circles: own up to {PAID_OWNED_POD_LIMIT} Pods, instead of {FREE_OWNED_POD_LIMIT}. Use one
              for each group you look out for.
            </li>
          </ul>

          <h3 className="mt-5 text-body-sm font-bold text-ink">Being built, and included when ready</h3>
          <ul className="mt-2 flex flex-col gap-3">
            {COMING.map((c) => (
              <li key={c.title} className="flex items-start gap-2.5">
                <Clock className="mt-0.5 size-4 shrink-0 text-ink-faint" />
                <div>
                  <p className="text-body-sm font-bold text-ink">{c.title}</p>
                  <p className="text-caption leading-relaxed text-ink-muted">{c.body}</p>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-5 rounded-xl bg-surface px-3.5 py-3 text-caption leading-relaxed text-ink-mid">
            One promise: alerts work the same way on every plan. The Care plan never changes who is alerted, in what
            order, or whether you can join a Pod or send an alert.
          </p>
        </section>

        <section className="rounded-2xl border-[0.5px] border-hairline bg-card p-5 shadow-raised lg:p-6">
          <p className="text-[32px] font-extrabold leading-none tracking-[-1px] text-ink">
            {price}
            <span className="ml-1 text-body-sm font-semibold tracking-normal text-ink-muted">/ month</span>
          </p>
          <p className="mt-1 text-caption text-ink-muted">
            Cancel any time and keep access until the month ends. See our{" "}
            <Link href="/terms#s7" className="font-bold underline underline-offset-2">
              payment and refund terms
            </Link>
            .
          </p>

          <div className="mt-4">
            {live && sub ? (
              <div>
                <p className="text-body-sm font-bold text-ink">
                  {sub.status === "CANCELLED"
                    ? `Cancelled. Your Care plan runs until ${formatDate(sub.currentPeriodEnd)}.`
                    : sub.status === "PAST_DUE"
                      ? `Your last payment didn't go through. Access runs until ${formatDate(sub.currentPeriodEnd)}.`
                      : `Active. Renews around ${formatDate(sub.currentPeriodEnd)}.`}
                </p>
                {sub.paystackSubscriptionCode && (
                  <div className="mt-3">
                    <BillingButton endpoint="/api/billing/manage" variant="quiet">
                      Update card or cancel
                    </BillingButton>
                  </div>
                )}
                {sub.status !== "ACTIVE" && ready && (
                  <div className="mt-3">
                    <BillingButton endpoint="/api/billing/checkout">Subscribe again</BillingButton>
                  </div>
                )}
              </div>
            ) : ready ? (
              <>
                <BillingButton endpoint="/api/billing/checkout">Subscribe for {price} / month</BillingButton>
                <p className="mt-2 text-center text-caption text-ink-muted">
                  Pay with mobile money or card through Paystack.
                </p>
              </>
            ) : (
              <InterestButton label={`Subscribe for ${price} / month`} initiallyInterested={Boolean(interest)} />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
