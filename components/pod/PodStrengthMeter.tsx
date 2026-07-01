"use client";

import Link from "next/link";
import { m } from "framer-motion";
import { ChevronRight } from "lucide-react";

export interface PodStrengthStep {
  id: string;
  label: string;
  complete: boolean;
  ctaRoute: string;
}

export interface PodStrengthMeterProps {
  score: number;
  steps: PodStrengthStep[];
  podName: string;
}

export function PodStrengthMeter({ score, steps }: PodStrengthMeterProps) {
  if (score >= 100) return null;

  const completeCount = steps.filter((s) => s.complete).length;
  const nextStep = steps.find((s) => !s.complete);

  return (
    <div className="rounded-card border-[0.5px] border-red-mid bg-red-light p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-bold text-ink lg:text-[15px]">Pod strength</p>
        <p className="text-[13px] font-bold text-red lg:text-[15px]">{score}%</p>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#FFE0E0] lg:mt-3 lg:h-2">
        <m.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="h-full rounded-full bg-red"
        />
      </div>

      <p className="mt-1.5 text-[11px] text-ink-muted lg:text-[13px]">
        {completeCount} of {steps.length} steps complete
      </p>

      {nextStep && (
        <Link
          href={nextStep.ctaRoute}
          className="mt-3 flex items-center justify-between rounded-xl bg-white/60 px-3 py-2.5 transition-colors duration-150 hover:bg-white lg:px-4 lg:py-3"
        >
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-red" />
            <span className="text-[13px] font-bold text-ink lg:text-[15px]">{nextStep.label}</span>
          </span>
          <ChevronRight className="size-4 text-red lg:size-5" />
        </Link>
      )}
    </div>
  );
}
