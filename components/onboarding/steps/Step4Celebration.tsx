"use client";

import { useEffect, useState } from "react";
import { m } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import type { BloodType } from "@prisma/client";
import { BLOOD_TYPE_LABELS } from "@/lib/blood-type";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function Step4Celebration({
  name,
  bloodType,
  podName,
  onNext,
}: {
  name: string | null;
  bloodType: BloodType | null;
  podName: string;
  onNext: () => void;
}) {
  const [pulse, setPulse] = useState(false);
  const firstName = name?.split(" ")[0] ?? "Your";

  useEffect(() => {
    const timer = setTimeout(() => setPulse(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-10">
      <m.div
        initial={{ opacity: 0, y: 60, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-[320px] rounded-2xl bg-ink p-5 text-white"
      >
        <div className="flex items-start justify-between">
          <span className="text-[9px] font-bold uppercase tracking-[2px] text-white/30">
            Donation passport
          </span>
          <span className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold"
            style={{
              backgroundColor: "rgba(22,163,74,0.15)",
              borderColor: "rgba(22,163,74,0.3)",
              color: "#86EFAC",
            }}
          >
            <ShieldCheck className="size-3" />
            Verified
          </span>
        </div>

        <div className="mt-4">
          <p className="text-sm font-bold text-white">{name ?? "Your name"}</p>
        </div>

        <m.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-2"
        >
          <p className="text-[52px] font-extrabold leading-none tracking-tight text-red">
            {bloodType ? BLOOD_TYPE_LABELS[bloodType] : "—"}
          </p>
          <p className="mt-1 text-[11px] text-white/50">Blood type</p>
        </m.div>

        <div className="mt-5 flex items-center gap-6 text-white/80">
          <span className="text-xs font-semibold">0 Donations</span>
          <span className="text-xs font-semibold">0 Pods</span>
          <span className="text-xs font-semibold text-[#34C759]">Active</span>
        </div>

        <div className="my-4 h-px bg-white/10" />

        <p className="text-[11px] text-white/50">
          Next eligible: <span className="text-white/80">when you donate</span>
        </p>
      </m.div>

      <m.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="mt-6 text-center text-[22px] font-extrabold tracking-[-0.5px] text-ink"
      >
        Your pod is live.
      </m.h2>

      <m.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.9 }}
        className="mt-1 text-center text-sm text-ink-muted"
      >
        {podName || `${firstName}'s Pod`} is ready. Now bring your people in.
      </m.p>

      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 1.2 }}
        className="mt-5 w-full max-w-[320px]"
      >
        <Button
          onClick={onNext}
          size="lg"
          className={cn("w-full", pulse && "animate-pulse-scale")}
        >
          Invite my first member →
        </Button>
      </m.div>
    </div>
  );
}
