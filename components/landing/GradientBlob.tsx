"use client";

import { m, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export function GradientBlob({
  color = "red",
  className,
  duration = 14,
  delay = 0,
}: {
  color?: "red" | "ink" | "white";
  className?: string;
  duration?: number;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  const gradients: Record<string, string> = {
    red: "radial-gradient(circle, rgba(221,0,0,0.55) 0%, rgba(221,0,0,0) 65%)",
    ink: "radial-gradient(circle, rgba(28,28,30,0.35) 0%, rgba(28,28,30,0) 65%)",
    white: "radial-gradient(circle, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 65%)",
  };

  // Each property drifts back and forth on its own period ("mirror"), so there is no loop point
  // to see: the motion just reverses smoothly. The three periods differ so the path never repeats
  // exactly. No blur filter either, since the gradient already fades to nothing at its edge and
  // re-blurring a moving element every frame is what made the section stutter.
  const drift = (seconds: number) =>
    ({ duration: seconds, delay, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }) as const;

  return (
    <m.div
      aria-hidden="true"
      initial={{ x: -45, y: 35, scale: 0.92 }}
      animate={reduce ? { x: 0, y: 0, scale: 1 } : { x: 45, y: -35, scale: 1.18 }}
      transition={{ x: drift(duration), y: drift(duration * 1.3), scale: drift(duration * 0.8) }}
      className={cn("pointer-events-none absolute rounded-full will-change-transform", className)}
      style={{ background: gradients[color] }}
    />
  );
}
