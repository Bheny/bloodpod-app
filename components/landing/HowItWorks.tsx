"use client";

import { ArrowRight } from "lucide-react";
import { m } from "framer-motion";
import { Reveal } from "@/components/landing/Reveal";
import { cardHover, cn } from "@/lib/utils";

const STEPS = [
  {
    step: "Step 1",
    title: "Create your pod",
    body: "Sign up and name your pod. You get a unique link: bloodpod.gh/pod/your-name. Takes 60 seconds.",
  },
  {
    step: "Step 2",
    title: "Invite your circle",
    body: "Share your pod link with family, friends, colleagues. They join BloodPod, add their blood type and profile. Your network is built.",
  },
  {
    step: "Step 3",
    title: "Your circle is always ready",
    body: "When anyone in your pod needs blood, everyone gets an SMS instantly. The right person responds. No phone calls. No panic.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-6 py-24">
      <div className="mx-auto max-w-[1000px]">
        <Reveal className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[2.5px] text-red">
            How it works
          </p>
          <h2 className="mt-4 text-[32px] font-extrabold tracking-[-1px] text-ink lg:text-[40px]">
            From zero to protected in three steps.
          </h2>
        </Reveal>

        <div className="mt-16 flex flex-col items-stretch gap-6 lg:flex-row lg:items-center">
          {STEPS.map((s, i) => (
            <div key={s.step} className="flex flex-1 items-center gap-6">
              <Reveal delay={i * 0.15} className="flex-1">
                <div
                  className={cn(
                    "h-full rounded-card border-[0.5px] border-[#E5E5EA] bg-white p-8",
                    cardHover,
                  )}
                >
                  <p className="text-[11px] font-bold uppercase tracking-[2px] text-red">
                    {s.step}
                  </p>
                  <h3 className="mt-2 text-lg font-bold text-ink">{s.title}</h3>
                  <p className="mt-2 text-sm leading-[1.7] text-ink-mid">{s.body}</p>
                </div>
              </Reveal>
              {i < STEPS.length - 1 && (
                <m.div
                  animate={{ x: [0, 6, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
                  className="hidden shrink-0 lg:block"
                >
                  <ArrowRight className="size-6 text-red" />
                </m.div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
