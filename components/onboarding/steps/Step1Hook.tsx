"use client";

import { m } from "framer-motion";
import { LogoMark } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";

export function Step1Hook({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-10 py-10 text-center">
      <m.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <LogoMark className="size-12" />
      </m.div>

      <m.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="mt-6 max-w-[280px] text-2xl font-extrabold tracking-[-0.8px] text-ink"
      >
        The people who will save your life are already in your phone.
      </m.h1>

      <m.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="mt-3 max-w-[280px] text-sm leading-[1.6] text-ink-muted"
      >
        BloodPod connects them into a circle that&apos;s always ready.
      </m.p>

      <m.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.45 }}
        className="mt-8 w-full max-w-[320px]"
      >
        <Button onClick={onNext} size="lg" className="w-full">
          Build my pod →
        </Button>
      </m.div>
    </div>
  );
}
