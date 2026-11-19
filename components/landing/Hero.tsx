"use client";

import Link from "next/link";
import { m } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { GradientBlob } from "@/components/landing/GradientBlob";
import { PhoneDemo } from "@/components/landing/PhoneDemo";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.4, 0, 0.2, 1] as const },
});

export function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pt-[100px] pb-20 lg:px-12 lg:pt-[130px]">
      <GradientBlob color="red" className="-right-32 top-10 size-105 opacity-70" duration={16} />

      <div className="relative mx-auto grid max-w-[1280px] items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="max-w-[680px]">
          <m.div
            {...fadeUp(0.1)}
            className="inline-flex items-center gap-2 rounded-full border border-red-mid bg-red-light px-3 py-1.5"
          >
            <span className="size-1.5 animate-pulse-dot rounded-full bg-red" />
            <span className="text-xs font-bold text-red-fg">Pilot launching in Ghana</span>
          </m.div>

          <m.h1
            {...fadeUp(0.2)}
            className="mt-6 text-[42px] font-extrabold leading-[1.04] tracking-[-1.5px] text-ink lg:text-[68px] lg:tracking-[-2.5px]"
          >
            When blood runs short,
            <br />
            <span className="text-red-fg">minutes</span> matter.
          </m.h1>

          <m.p
            {...fadeUp(0.35)}
            className="mt-6 max-w-[520px] text-lg leading-[1.7] text-ink-mid"
          >
            BloodPod gathers the people you trust into a Pod. When someone
            needs blood, the right donors get an alert on their phone and
            answer Yes or No in seconds, with no calls and no group-chat
            chaos.
          </m.p>

          <m.div {...fadeUp(0.5)} className="mt-10 flex flex-wrap items-center gap-6">
            <Button asChild size="lg">
              <Link href="/start">Build my network →</Link>
            </Button>
          </m.div>

          <m.ul
            {...fadeUp(0.65)}
            className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-muted"
          >
            <li>Free for donors</li>
            <li>Works from a link, no app store</li>
            <li>Your details stay private until you say Yes</li>
          </m.ul>
        </div>

        <m.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35, ease: [0.4, 0, 0.2, 1] }}
          className="relative flex justify-center lg:justify-end"
        >
          <GradientBlob color="red" className="inset-0 -z-10 m-auto size-80" />
          <PhoneDemo />
        </m.div>
      </div>
    </section>
  );
}
