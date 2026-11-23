"use client";

import { useState } from "react";
import Link from "next/link";
import { HandHeart, ShieldCheck, type LucideIcon } from "lucide-react";
import { Reveal } from "@/components/landing/Reveal";
import { Button } from "@/components/ui/Button";
import { BillingToggle, type Billing } from "@/components/plans/BillingToggle";
import { PlanLines } from "@/components/plans/PlanLines";
import { TIERS, type TierId } from "@/lib/plan-catalog";
import { cn } from "@/lib/utils";

const TIER_ICON: Record<TierId, LucideIcon> = { FREE: ShieldCheck, PLUS: HandHeart };

/** The Free and Plus cards, with the monthly/yearly choice above them. Yearly is picked to begin with. */
export function PricingTiers() {
  const [billing, setBilling] = useState<Billing>("yearly");
  const plus = TIERS.find((t) => t.id === "PLUS");
  const offer = plus?.yearly;

  return (
    <>
      {offer && (
        <Reveal className="mt-10 flex justify-center">
          <BillingToggle value={billing} onChange={setBilling} saving={offer.saving} />
        </Reveal>
      )}

      <div className="mx-auto mt-8 grid max-w-[860px] items-stretch gap-5 lg:grid-cols-2">
        {TIERS.map((plan, i) => {
          const Icon = TIER_ICON[plan.id];
          const featured = plan.id === "PLUS";
          const yearly = featured && billing === "yearly" && plan.yearly ? plan.yearly : null;
          return (
            <Reveal key={plan.id} delay={i * 0.08} className="h-full">
              <div
                className={cn(
                  "relative flex h-full flex-col rounded-3xl border bg-card p-7 transition-shadow lg:p-8",
                  featured ? "border-red-mid shadow-floating ring-1 ring-red/15" : "border-hairline shadow-raised hover:shadow-floating",
                )}
              >
                {featured && (
                  <span className="absolute -top-3 left-7 rounded-full bg-red px-3 py-1 text-[11px] font-bold uppercase tracking-[1.5px] text-white">
                    For you and your family
                  </span>
                )}
                <span className={cn("flex size-11 items-center justify-center rounded-2xl", featured ? "bg-red text-white" : "bg-red-light text-red-fg")}>
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-xl font-extrabold tracking-[-0.4px] text-ink">{plan.name}</h3>
                <p className="mt-1 min-h-10 text-sm leading-snug text-ink-muted">{plan.audience}</p>

                <div className="mt-5 border-b-[0.5px] border-hairline pb-6">
                  <p className="flex items-baseline gap-2" aria-live="polite">
                    <span className="text-[44px] font-extrabold leading-none tracking-[-2px] text-ink">{yearly ? yearly.price : plan.price}</span>
                    <span className="text-sm font-semibold text-ink-muted">{yearly ? yearly.cadence : plan.cadence}</span>
                  </p>
                  {/* Same height on every card, so the lists below start level. */}
                  <p className="mt-2 flex min-h-6 flex-wrap items-center gap-2 text-sm text-ink-muted">
                    {yearly ? (
                      <>
                        <span className="rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-bold text-success-strong">{yearly.saving}</span>
                        <span>
                          {yearly.perMonth} a month, paid once a year{" "}
                          <span className="text-ink-faint line-through">{yearly.monthlyTotal}</span>
                        </span>
                      </>
                    ) : featured && plan.yearly ? (
                      <button type="button" onClick={() => setBilling("yearly")} className="font-semibold text-red-fg underline underline-offset-2">
                        Or {plan.yearly.price} a year and get {plan.yearly.saving}
                      </button>
                    ) : null}
                  </p>
                </div>

                <PlanLines lines={plan.lines} />

                <div className="mt-8">
                  <Button asChild size="lg" variant={featured ? "primary" : "secondary"} className="w-full whitespace-nowrap text-center">
                    <Link href="/start">Start free</Link>
                  </Button>
                  <p className="mt-3 text-center text-xs text-ink-muted">
                    {plan.id === "FREE" ? "No payment needed" : "Upgrade later, inside the app"}
                  </p>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </>
  );
}
