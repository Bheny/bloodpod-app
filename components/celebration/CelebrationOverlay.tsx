"use client";

import { useEffect, useMemo } from "react";
import { AnimatePresence, m } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { playCelebrationChime } from "@/lib/celebration-sound";

const CONFETTI_COLORS = ["#DD0000", "#FFB800", "#34C759", "#0A84FF", "#FF2D55"];
const CONFETTI_COUNT = 22;
const AUTO_DISMISS_MS = 2400;

interface ConfettiPiece {
  id: number;
  left: number;
  color: string;
  delay: number;
  duration: number;
  rotate: number;
}

function useConfettiPieces(): ConfettiPiece[] {
  return useMemo(
    () =>
      Array.from({ length: CONFETTI_COUNT }, (_, id) => ({
        id,
        left: Math.random() * 100,
        color: CONFETTI_COLORS[id % CONFETTI_COLORS.length],
        delay: Math.random() * 0.25,
        duration: 1.1 + Math.random() * 0.6,
        rotate: Math.random() * 360,
      })),
    [],
  );
}

export function CelebrationOverlay({
  title,
  subtitle,
  icon: Icon,
  onDismiss,
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  onDismiss: () => void;
}) {
  const confetti = useConfettiPieces();

  useEffect(() => {
    playCelebrationChime();
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <AnimatePresence>
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onDismiss}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6"
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {confetti.map((c) => (
            <m.span
              key={c.id}
              initial={{ y: -20, x: `${c.left}vw`, opacity: 1, rotate: 0 }}
              animate={{ y: "110vh", opacity: 0, rotate: c.rotate }}
              transition={{ duration: c.duration, delay: c.delay, ease: "easeIn" }}
              className="absolute top-0 block size-2 rounded-sm"
              style={{ backgroundColor: c.color }}
            />
          ))}
        </div>

        <m.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          className="relative w-full max-w-[320px] rounded-2xl bg-white p-6 text-center shadow-floating"
        >
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-red-light">
            <Icon className="size-7 text-red" />
          </span>
          <h2 className="mt-4 text-[20px] font-extrabold tracking-[-0.5px] text-ink">{title}</h2>
          <p className="mt-1.5 text-sm text-ink-muted">{subtitle}</p>
        </m.div>
      </m.div>
    </AnimatePresence>
  );
}
