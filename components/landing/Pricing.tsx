import Link from "next/link";
import { Check } from "lucide-react";
import { Reveal } from "@/components/landing/Reveal";
import { GradientBlob } from "@/components/landing/GradientBlob";
import { Button } from "@/components/ui/Button";
import { cardHover, cn } from "@/lib/utils";

const FREE_FEATURES = [
  "1 pod",
  "Up to 20 members",
  "Donation passport",
  "SMS emergency alerts",
  "Pod invite link",
  "Basic donation history",
];

const PRO_FEATURES = [
  "Unlimited pods",
  "Unlimited members",
  "City-wide matching",
  "Priority SMS alerts",
  "Verified badge on profile",
  "Full donation history + export",
  "Hospital verification access",
];

export function Pricing() {
  return (
    <section id="pricing" className="px-6 py-24">
      <div className="mx-auto max-w-[900px]">
        <Reveal className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[2.5px] text-red">
            Simple pricing
          </p>
          <h2 className="mt-4 text-[32px] font-extrabold tracking-[-1px] text-ink lg:text-[40px]">
            Start free. Upgrade when you&apos;re ready.
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          <Reveal>
            <div
              className={cn(
                "flex h-full flex-col rounded-card border-[0.5px] border-[#E5E5EA] bg-white p-8",
                cardHover,
              )}
            >
              <p className="text-sm font-bold uppercase tracking-wide text-ink-muted">
                Donor
              </p>
              <p className="mt-3 text-3xl font-extrabold text-ink">
                Free <span className="text-base font-medium text-ink-muted">forever</span>
              </p>
              <ul className="mt-6 flex flex-1 flex-col gap-3">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-ink-mid">
                    <Check className="size-4 shrink-0 text-red" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button asChild variant="secondary" className="mt-8">
                <Link href="/sign-up">Start for free →</Link>
              </Button>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="relative">
            <GradientBlob color="red" className="inset-0 -z-10 m-auto size-72 opacity-60" />
            <div
              className={cn(
                "relative flex h-full flex-col rounded-card border-2 border-red bg-white p-8",
                "transition-all duration-200 ease-out hover:-translate-y-1.5 hover:shadow-[0_24px_48px_-16px_rgba(221,0,0,0.3)]",
              )}
            >
              <span className="absolute -top-3.5 left-8 rounded-full bg-red-light px-3 py-1 text-[11px] font-bold text-red">
                Most popular
              </span>
              <p className="text-sm font-bold uppercase tracking-wide text-red">
                Pod Pro
              </p>
              <p className="mt-3 text-3xl font-extrabold text-ink">
                GHS 10<span className="text-base font-medium text-ink-muted">/month</span>
              </p>
              <p className="text-sm text-ink-muted">or GHS 99/year</p>
              <ul className="mt-6 flex flex-1 flex-col gap-3">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-ink-mid">
                    <Check className="size-4 shrink-0 text-red" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-8">
                <Link href="/sign-up">Get Pod Pro →</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
