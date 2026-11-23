"use client";

import { cn } from "@/lib/utils";

export type Billing = "monthly" | "yearly";

/** Monthly or yearly. Yearly is the suggested choice, so it carries the saving. */
export function BillingToggle({
  value,
  onChange,
  saving,
  className,
}: {
  value: Billing;
  onChange: (next: Billing) => void;
  /** e.g. "2 months free", shown on the yearly side. */
  saving: string;
  className?: string;
}) {
  const options: { id: Billing; label: string }[] = [
    { id: "monthly", label: "Monthly" },
    { id: "yearly", label: "Yearly" },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="How you pay"
      className={cn("inline-flex items-center gap-1 rounded-full bg-fill p-1", className)}
    >
      {options.map((o) => {
        const on = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.id)}
            className={cn(
              "flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-bold transition-colors",
              on ? "bg-card text-ink shadow-raised" : "text-ink-muted hover:text-ink",
            )}
          >
            {o.label}
            {o.id === "yearly" && (
              <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", on ? "bg-red text-white" : "bg-red-light text-red-fg")}>
                {saving}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
