import Link from "next/link";
import { CalendarDays, HeartPulse, ShieldCheck, Smartphone, type LucideIcon } from "lucide-react";
import { Reveal } from "@/components/landing/Reveal";
import { PricingTiers } from "@/components/landing/PricingTiers";
import { Button } from "@/components/ui/Button";
import { ComparisonTable } from "@/components/plans/ComparisonTable";
import { PlanLines } from "@/components/plans/PlanLines";
import { PACKAGES, PLAN_PROMISE, type PackageId } from "@/lib/plan-catalog";

const PACKAGE_ICON: Record<PackageId, LucideIcon> = { CARE: HeartPulse, CASE: CalendarDays };

export function Pricing() {
  return (
    <section id="pricing" className="bg-surface px-6 py-24">
      <div className="mx-auto max-w-[1100px]">
        <Reveal className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[2.5px] text-red-fg">Pricing</p>
          <h2 className="mt-4 text-[32px] font-extrabold tracking-[-1px] text-ink lg:text-[44px]">Finding blood is always free.</h2>
          <p className="mx-auto mt-4 max-w-[540px] text-base leading-[1.7] text-ink-mid">
            Pay only if you want extra tools for looking after your circle.
          </p>
        </Reveal>

        {/* The one promise, where it cannot be missed. */}
        <Reveal className="mt-8">
          <div className="mx-auto flex max-w-[720px] items-start gap-3.5 rounded-2xl border-[0.5px] border-success-strong/25 bg-success-soft px-5 py-4">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-success-strong" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-ink">{PLAN_PROMISE}</p>
          </div>
        </Reveal>

        <PricingTiers />

        <Reveal className="mt-20 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[2.5px] text-red-fg">Compare</p>
          <h3 className="mt-3 text-[26px] font-extrabold tracking-[-0.8px] text-ink lg:text-[32px]">Free and Plus, side by side</h3>
          <p className="mx-auto mt-3 max-w-[560px] text-sm leading-[1.7] text-ink-mid">
            Everything on Free stays free. Plus adds tools for keeping your health records and looking after your family.
          </p>
        </Reveal>
        <Reveal className="mx-auto mt-8 max-w-[860px]">
          <ComparisonTable />
        </Reveal>

        <Reveal className="mt-20 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[2.5px] text-red-fg">Special packages</p>
          <h3 className="mt-3 text-[26px] font-extrabold tracking-[-0.8px] text-ink lg:text-[32px]">When a patient needs blood on a schedule</h3>
          <p className="mx-auto mt-3 max-w-[560px] text-sm leading-[1.7] text-ink-mid">
            Built around one person and one date. You don&apos;t need Plus to use them.
          </p>
        </Reveal>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {PACKAGES.map((pkg, i) => {
            const Icon = PACKAGE_ICON[pkg.id];
            const live = pkg.id === "CARE";
            return (
              <Reveal key={pkg.id} delay={i * 0.08} className="h-full">
                <div className="flex h-full flex-col rounded-3xl border border-hairline bg-card p-7 shadow-raised lg:p-8">
                  <div className="flex items-start gap-4">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-red-light text-red-fg">
                      <Icon className="size-6" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xl font-extrabold tracking-[-0.4px] text-ink">{pkg.name}</h4>
                      <p className="mt-1 text-sm leading-snug text-ink-muted">{pkg.audience}</p>
                    </div>
                  </div>

                  <p className="mt-5 flex items-baseline gap-2 border-b-[0.5px] border-hairline pb-6">
                    <span className="text-[36px] font-extrabold leading-none tracking-[-1.5px] text-ink">{pkg.price}</span>
                    <span className="text-sm font-semibold text-ink-muted">{pkg.cadence}</span>
                  </p>

                  <PlanLines lines={pkg.lines} />

                  <div className="mt-8">
                    {live ? (
                      <>
                        <Button asChild size="lg" variant="secondary" className="w-full whitespace-nowrap text-center">
                          <Link href="/start">Start free</Link>
                        </Button>
                        <p className="mt-3 text-center text-xs text-ink-muted">Subscribe later, inside the app</p>
                      </>
                    ) : (
                      <>
                        <Button size="lg" variant="ghost" disabled className="w-full whitespace-nowrap text-center">
                          Coming soon
                        </Button>
                        <p className="mt-3 text-center text-xs text-ink-muted">We&apos;ll open it once it&apos;s ready</p>
                      </>
                    )}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal className="mt-10">
          <div className="mx-auto flex max-w-[720px] flex-col items-center gap-3 text-center">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Smartphone className="size-4 text-ink-muted" aria-hidden="true" />
              Pay by mobile money or card through Paystack
            </p>
            <p className="text-sm leading-[1.7] text-ink-muted">
              A hospital can sponsor a family&apos;s Care Pod or Case Pod, so they pay nothing. See our{" "}
              <Link href="/terms#s7" className="font-semibold text-ink underline underline-offset-2">
                payment and refund terms
              </Link>
              .
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
