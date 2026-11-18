"use client";

import { useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { BadgeCheck, WifiOff } from "lucide-react";
import { Reveal } from "@/components/landing/Reveal";
import { GradientBlob } from "@/components/landing/GradientBlob";
import { cn } from "@/lib/utils";

function Switch({
  on,
  onChange,
  label,
  hint,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="flex w-full items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition-colors hover:bg-white/10"
    >
      <span>
        <span className="block text-sm font-bold text-white">{label}</span>
        <span className="block text-xs text-white/50">{hint}</span>
      </span>
      <span
        className={cn(
          "flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 transition-colors",
          on ? "justify-end bg-red" : "justify-start bg-white/20",
        )}
      >
        <m.span layout transition={{ type: "spring", stiffness: 500, damping: 32 }} className="size-5 rounded-full bg-white" />
      </span>
    </button>
  );
}

export function BloodCard() {
  const [verified, setVerified] = useState(false);
  const [offline, setOffline] = useState(false);

  return (
    <section className="relative overflow-hidden bg-ink px-6 py-24 lg:px-12">
      <GradientBlob color="red" className="-left-32 inset-y-0 my-auto size-105" />

      <div className="relative mx-auto grid max-w-[1100px] items-center gap-14 lg:grid-cols-2">
        <Reveal className="flex flex-col items-center gap-3 lg:items-start">
          <m.div
            animate={{ rotate: verified ? 0 : -2 }}
            transition={{ type: "spring", stiffness: 180, damping: 16 }}
            className="w-full max-w-[360px] rounded-card border border-white/10 bg-[#2C2C2E] p-6 text-white"
          >
            <div className="flex items-start justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[2px] text-white/50">Blood Card</span>
              <AnimatePresence mode="wait" initial={false}>
                <m.span
                  key={verified ? "v" : "s"}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.7, opacity: 0 }}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
                    verified ? "bg-red text-white" : "bg-white/10 text-white/70",
                  )}
                >
                  {verified && <BadgeCheck className="size-3.5" />}
                  {verified ? "Lab-verified" : "Self-reported"}
                </m.span>
              </AnimatePresence>
            </div>

            <div className="mt-6 text-[52px] font-extrabold leading-none tracking-tight text-red">O−</div>
            <p className="mt-4 text-base font-bold">Example Donor</p>
            <p className="text-sm text-white/50">Accra, Ghana</p>

            <div className="my-6 h-px bg-white/10" />

            <div className="flex items-end justify-between">
              <div>
                <p className="text-[11px] text-white/50">Last donation</p>
                <p className="text-sm font-bold">4 months ago</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-white/50">Next eligible</p>
                <p className="text-sm font-bold text-[#34C759]">Now</p>
              </div>
            </div>

            <AnimatePresence>
              {offline && (
                <m.p
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-4 flex items-center gap-2 overflow-hidden rounded-xl bg-white/10 px-3 py-2 text-xs text-white/80"
                >
                  <WifiOff className="size-3.5" /> No signal, and your card still opens
                </m.p>
              )}
            </AnimatePresence>
          </m.div>
          <p className="text-xs text-white/40">Example card</p>
        </Reveal>

        <Reveal delay={0.15}>
          <p className="text-[11px] font-bold uppercase tracking-[2.5px] text-red">Your Blood Card</p>
          <h2 className="mt-4 text-[32px] font-extrabold leading-[1.15] tracking-[-1px] text-white lg:text-[36px]">
            Your blood type, always on hand.
          </h2>
          <p className="mt-6 text-base leading-[1.7] text-white/60">
            Keep your blood type, your last donation and your next eligible
            date in one place. Upload a lab report and, once it is reviewed,
            your card carries a verified badge.
          </p>
          <p className="mt-4 text-base leading-[1.7] text-white/60">
            The badge shows that your report was checked. The hospital still
            tests and crossmatches blood at the point of donation.
          </p>

          <div className="mt-8 space-y-3">
            <Switch on={verified} onChange={setVerified} label="Lab report reviewed" hint="See the verified badge appear" />
            <Switch on={offline} onChange={setOffline} label="Lose your signal" hint="The card works offline" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
