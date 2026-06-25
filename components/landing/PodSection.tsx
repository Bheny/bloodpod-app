"use client";

import { Droplet } from "lucide-react";
import { m } from "framer-motion";
import { Reveal } from "@/components/landing/Reveal";
import { cardHover, cn } from "@/lib/utils";

const MEMBERS = [
  { initials: "KO", bg: "#FFE5E5" },
  { initials: "AM", bg: "#FFF0F0" },
  { initials: "AB", bg: "#FFBDBD" },
  { initials: "KW", bg: "#F2F2F2" },
  { initials: "EF", bg: "#FFD9D9" },
];

export function PodSection() {
  return (
    <section className="px-6 py-24 lg:px-12">
      <div className="mx-auto grid max-w-[1100px] items-center gap-16 lg:grid-cols-2">
        <Reveal>
          <p className="text-[11px] font-bold uppercase tracking-[2.5px] text-red">
            Your circle
          </p>
          <h2 className="mt-4 text-[32px] font-extrabold leading-[1.15] tracking-[-1px] text-ink lg:text-[36px]">
            Your pod. Your people. Your lifeline.
          </h2>

          <p className="mt-6 text-base leading-[1.7] text-ink-mid">
            Most blood emergencies happen with zero warning. BloodPod gives
            you a network that&apos;s already activated before the crisis
            hits.
          </p>
          <p className="mt-4 text-base leading-[1.7] text-ink-mid">
            Your pod is private. Your members trust each other. And when it
            matters — the right person is already there.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-6">
            <div className="flex-1 rounded-card border-[0.5px] border-[#E5E5EA] bg-white p-5">
              <p className="text-[11px] font-bold uppercase tracking-[2px] text-ink-muted">
                Free
              </p>
              <p className="mt-1 text-sm font-semibold text-ink">
                1 pod · 20 members
              </p>
            </div>
            <div className="flex-1 rounded-card border-[1.5px] border-red-mid bg-red-light p-5">
              <p className="text-[11px] font-bold uppercase tracking-[2px] text-red">
                Premium
              </p>
              <p className="mt-1 text-sm font-semibold text-ink">
                Unlimited pods · Unlimited members · City-wide matching
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.15} className="flex justify-center lg:justify-end">
          <div
            className={cn(
              "w-full max-w-95 rounded-card border-[0.5px] border-[#E5E5EA] bg-white p-6",
              cardHover,
            )}
          >
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-icon bg-red-light text-red">
                <Droplet className="size-4" />
              </span>
              <p className="font-bold text-ink">Kwame&apos;s Pod</p>
            </div>

            <div className="mt-6 flex -space-x-3">
              {MEMBERS.map((member) => (
                <m.span
                  key={member.initials}
                  style={{ backgroundColor: member.bg }}
                  whileHover={{ y: -4, scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                  className="flex size-11 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-ink"
                >
                  {member.initials}
                </m.span>
              ))}
              <span className="flex size-11 items-center justify-center rounded-full border-2 border-white bg-surface text-xs font-bold text-ink-muted">
                +7
              </span>
            </div>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1.5">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#34C759] opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-[#34C759]" />
              </span>
              <span className="text-xs font-semibold text-ink-mid">
                12 of 20 members · active
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
