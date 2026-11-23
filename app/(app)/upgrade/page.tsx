import Link from "next/link";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { getCareSubscription } from "@/lib/billing";
import { paymentsConfigured } from "@/lib/paystack";
import { formatDate } from "@/lib/formatters";
import { PACKAGES, PLAN_NAMES, PLAN_PROMISE, TIERS, type PlanLine } from "@/lib/plan-catalog";
import { AppHeader } from "@/components/layout/AppHeader";
import { BillingButton } from "@/components/billing/BillingButton";
import { InterestButton } from "@/components/billing/InterestButton";
import { ComparisonTable } from "@/components/plans/ComparisonTable";
import { PlusHeader } from "@/components/plans/PlusHeader";

const card = "rounded-3xl border-[0.5px] border-hairline bg-card p-5 shadow-raised lg:rounded-2xl lg:p-6";

function Lines({ lines }: { lines: PlanLine[] }) {
  return (
    <ul className="mt-3 flex flex-col gap-2.5 text-body-sm text-ink">
      {lines.map((l) => (
        <li key={l.text} className="flex items-start gap-2.5">
          <Check className="mt-0.5 size-4 shrink-0 text-success-strong" aria-hidden />
          <span>
            {l.text}
            {l.soon && <span className="ml-2 rounded-full bg-surface px-2 py-0.5 text-label font-bold uppercase tracking-wide text-ink-muted">Soon</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Price({ price, cadence }: { price: string; cadence: string }) {
  return (
    <p className="text-[28px] font-extrabold leading-none tracking-[-1px] text-ink">
      {price}
      <span className="ml-1 text-body-sm font-semibold tracking-normal text-ink-muted">{cadence}</span>
    </p>
  );
}

export default async function UpgradePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user.hospitalId) redirect("/hospital");
  if (user.labId) redirect("/lab");
  if (!user.onboardingComplete) redirect("/onboarding");

  const [careSub, interests] = await Promise.all([
    getCareSubscription(user.id),
    prisma.planInterest.findMany({ where: { userId: user.id }, select: { plan: true } }),
  ]);
  const wants = new Set<string>(interests.map((i) => i.plan));
  const careLive = Boolean(careSub && careSub.status !== "EXPIRED" && careSub.currentPeriodEnd > new Date());
  const paymentsReady = paymentsConfigured();
  const carePkg = PACKAGES.find((p) => p.id === "CARE")!;
  const casePkg = PACKAGES.find((p) => p.id === "CASE")!;

  return (
    <div>
      <AppHeader title="Plans" subtitle="Tools for looking after the people you trust" />

      <div className="flex flex-col gap-3.5 px-3.5 pb-8 pt-4 lg:max-w-xl lg:px-0 lg:pt-0">
        <p className="rounded-2xl bg-surface px-4 py-3 text-caption leading-relaxed text-ink-mid">{PLAN_PROMISE}</p>

        {TIERS.map((tier) => (
          <section key={tier.id} className={card} aria-labelledby={`plan-${tier.id}`}>
            {tier.yearly ? (
              <PlusHeader tier={tier} />
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 id={`plan-${tier.id}`} className="text-title font-extrabold tracking-[-0.4px] text-ink">
                    {tier.name}
                  </h2>
                  <p className="mt-0.5 text-caption text-ink-muted">{tier.audience}</p>
                </div>
                <Price price={tier.price} cadence={tier.cadence} />
              </div>
            )}
            <Lines lines={tier.lines} />
            <div className="mt-4">
              {tier.id === "FREE" ? (
                <p className="text-center text-body-sm font-bold text-ink-muted">{careLive ? "Always included" : "Your plan"}</p>
              ) : (
                <InterestButton
                  plan={tier.id}
                  planName={PLAN_NAMES[tier.id]}
                  label={`Tell me when ${tier.name} opens`}
                  initiallyInterested={wants.has(tier.id)}
                  variant={tier.id === "PLUS" ? "primary" : "secondary"}
                />
              )}
            </div>
          </section>
        ))}

        <div className="px-1 pt-3">
          <h2 className="text-title font-extrabold tracking-[-0.4px] text-ink">Free and Plus, side by side</h2>
          <p className="mt-0.5 text-caption text-ink-muted">Everything on Free stays free.</p>
        </div>
        <ComparisonTable />

        <div className="px-1 pt-3">
          <h2 className="text-title font-extrabold tracking-[-0.4px] text-ink">Special packages</h2>
          <p className="mt-0.5 text-caption text-ink-muted">For a patient who needs blood on a schedule. You don&apos;t need Plus.</p>
        </div>

        <section className={card} aria-labelledby="plan-CARE">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 id="plan-CARE" className="text-title font-extrabold tracking-[-0.4px] text-ink">
                {carePkg.name}
              </h3>
              <p className="mt-0.5 text-caption text-ink-muted">{carePkg.audience}</p>
            </div>
            <Price price={carePkg.price} cadence={carePkg.cadence} />
          </div>
          <Lines lines={carePkg.lines} />
          <p className="mt-3 text-caption text-ink-muted">
            Cancel any time and keep access until the month ends. See our{" "}
            <Link href="/terms#s7" className="font-bold underline underline-offset-2">
              payment and refund terms
            </Link>
            .
          </p>

          <div className="mt-4">
            {careLive && careSub ? (
              <div>
                <p className="text-body-sm font-bold text-ink">
                  {careSub.status === "CANCELLED"
                    ? `Cancelled. Your Care Pod access runs until ${formatDate(careSub.currentPeriodEnd)}.`
                    : careSub.status === "PAST_DUE"
                      ? `Your last payment didn't go through. Access runs until ${formatDate(careSub.currentPeriodEnd)}.`
                      : `Active. Renews around ${formatDate(careSub.currentPeriodEnd)}.`}
                </p>
                <div className="mt-3">
                  <Link href="/care" className="text-body-sm font-bold text-red-fg underline underline-offset-2">
                    Open your Care Pods
                  </Link>
                </div>
                {careSub.paystackSubscriptionCode && (
                  <div className="mt-3">
                    <BillingButton endpoint="/api/billing/manage" variant="quiet">
                      Update card or cancel
                    </BillingButton>
                  </div>
                )}
                {careSub.status !== "ACTIVE" && paymentsReady && (
                  <div className="mt-3">
                    <BillingButton endpoint="/api/billing/checkout">Subscribe again</BillingButton>
                  </div>
                )}
              </div>
            ) : paymentsReady ? (
              <>
                <BillingButton endpoint="/api/billing/checkout">Subscribe for {carePkg.price} / month</BillingButton>
                <p className="mt-2 text-center text-caption text-ink-muted">Pay with mobile money or card through Paystack.</p>
              </>
            ) : (
              <InterestButton plan="CARE" planName={PLAN_NAMES.CARE} label={`Subscribe for ${carePkg.price} / month`} initiallyInterested={wants.has("CARE")} />
            )}
          </div>
        </section>

        <section className={card} aria-labelledby="plan-CASE">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 id="plan-CASE" className="text-title font-extrabold tracking-[-0.4px] text-ink">
                {casePkg.name}
              </h3>
              <p className="mt-0.5 text-caption text-ink-muted">{casePkg.audience}</p>
            </div>
            <Price price={casePkg.price} cadence={casePkg.cadence} />
          </div>
          <Lines lines={casePkg.lines} />
          <p className="mt-4 rounded-xl bg-surface px-3.5 py-3 text-center text-body-sm font-bold text-ink-muted">Coming soon</p>
        </section>
      </div>
    </div>
  );
}
