"use client";

import { m } from "framer-motion";
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
  const gradients: Record<string, string> = {
    red: "radial-gradient(circle, rgba(221,0,0,0.55) 0%, rgba(221,0,0,0) 65%)",
    ink: "radial-gradient(circle, rgba(28,28,30,0.35) 0%, rgba(28,28,30,0) 65%)",
    white: "radial-gradient(circle, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 65%)",
  };

  return (
    <m.div
      aria-hidden="true"
      animate={{
        x: [0, 90, -70, 0],
        y: [0, -80, 60, 0],
        scale: [1, 1.3, 0.8, 1],
      }}
      transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
      className={cn("pointer-events-none absolute rounded-full blur-2xl", className)}
      style={{ background: gradients[color] }}
    />
  );
}
