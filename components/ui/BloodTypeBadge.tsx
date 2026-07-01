import * as React from "react";
import { cn } from "@/lib/utils";

export function BloodTypeBadge({
  bloodType,
  size = "md",
  className,
  ...props
}: {
  bloodType: string | null;
  size?: "sm" | "md";
  className?: string;
} & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-ink font-extrabold text-white",
        size === "sm" ? "size-6 text-label" : "size-9 text-xs",
        className,
      )}
      {...props}
    >
      {bloodType ?? "—"}
    </span>
  );
}
