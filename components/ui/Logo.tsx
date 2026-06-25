"use client";

import { m } from "framer-motion";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("h-7 w-7", className)}
      aria-hidden="true"
      fill="none"
    >
      <ellipse cx="12" cy="16" rx="10" ry="11" fill="#1C1C1E" />
      <ellipse cx="20" cy="16" rx="10" ry="11" fill="#DD0000" />
      <ellipse cx="16" cy="16" rx="4.5" ry="5.5" fill="#FFFFFF" />
    </svg>
  );
}

export function Logo({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <m.span
        whileHover={{ rotate: -10, scale: 1.1 }}
        transition={{ type: "spring", stiffness: 300, damping: 12 }}
        className="inline-flex"
      >
        <LogoMark className={markClassName} />
      </m.span>
      <span className="text-lg font-extrabold tracking-tight text-ink">
        Blood<span className="text-red">Pod</span>
      </span>
    </span>
  );
}
