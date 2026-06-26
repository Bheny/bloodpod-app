"use client";

import Link from "next/link";
import { m } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { PassportCard } from "@/components/landing/PassportCard";
import { GradientBlob } from "@/components/landing/GradientBlob";
import { TiltCard } from "@/components/landing/TiltCard";

const AVATARS = [
  { initials: "AM", bg: "#FFE5E5" },
  { initials: "KO", bg: "#FFF0F0" },
  { initials: "AB", bg: "#FFBDBD" },
  { initials: "KW", bg: "#F2F2F2" },
  { initials: "EF", bg: "#FFD9D9" },
];

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.4, 0, 0.2, 1] as const },
});

export function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pt-[100px] pb-20 lg:px-12 lg:pt-[140px]">
      <GradientBlob color="red" className="-right-32 top-10 size-105" duration={16} />
      <GradientBlob color="ink" className="-left-40 top-1/2 size-90" duration={12} delay={2} />

      <div className="relative mx-auto grid max-w-[1280px] items-center gap-16 lg:grid-cols-2">
        <div className="max-w-[680px]">
          <m.div
            {...fadeUp(0.1)}
            className="inline-flex items-center gap-2 rounded-full border border-red-mid bg-red-light px-3 py-1.5"
          >
            <span className="size-1.5 animate-pulse-dot rounded-full bg-red" />
            <span className="text-xs font-bold text-red">Now in Ghana</span>
          </m.div>

          <m.h1
            {...fadeUp(0.2)}
            className="mt-6 text-[40px] font-extrabold leading-[1.05] tracking-[-1.5px] text-ink lg:text-[64px] lg:tracking-[-2px]"
          >
            The blood you need
            <br />
            already exists.
            <br />
            Finding it fast doesn&apos;t.
          </m.h1>

          <m.p
            {...fadeUp(0.35)}
            className="mt-6 max-w-[520px] text-lg leading-[1.7] text-ink-mid"
          >
            BloodPod organizes your circle by blood type before the
            emergency — so when it happens, you already know exactly who
            to call.
          </m.p>

          <m.div {...fadeUp(0.5)} className="mt-10 flex flex-wrap items-center gap-6">
            <Button asChild size="lg">
              <Link href="/sign-up">Build your pod →</Link>
            </Button>
            <a
              href="#how-it-works"
              className="text-base font-semibold text-red underline-offset-4 hover:underline"
            >
              See how it works ↓
            </a>
          </m.div>

          <m.div {...fadeUp(0.65)} className="mt-12 flex items-center gap-3">
            <div className="flex -space-x-2">
              {AVATARS.map((a) => (
                <m.span
                  key={a.initials}
                  style={{ backgroundColor: a.bg }}
                  whileHover={{ y: -4, scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                  className="flex size-8 items-center justify-center rounded-full border-2 border-white text-[11px] font-bold text-ink"
                >
                  {a.initials}
                </m.span>
              ))}
            </div>
            <p className="text-sm text-ink-muted">
              <span className="font-bold text-ink">847</span> people have built
              their pod
            </p>
          </m.div>
        </div>

        <m.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="relative flex justify-center lg:justify-end"
        >
          <GradientBlob color="red" className="inset-0 -z-10 m-auto size-80" />
          <TiltCard className="animate-float">
            <PassportCard variant="standalone" />
          </TiltCard>
        </m.div>
      </div>
    </section>
  );
}
