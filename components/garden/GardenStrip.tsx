import Link from "next/link";
import { ChevronRight, Sprout } from "lucide-react";
import type { GardenSummary } from "@/lib/garden-data";

/** A one-line way into the Garden from the dashboard: the stage, the title, and a nudge if this week is not ticked yet. */
export function GardenStrip({ garden }: { garden: GardenSummary }) {
  const started = garden.plots > 0;
  return (
    <Link
      href="/garden"
      className="flex items-center gap-3 rounded-3xl border-[0.5px] border-hairline bg-card px-4 py-3.5 shadow-raised transition-transform active:scale-[0.98] lg:rounded-2xl motion-reduce:transition-none"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-success-soft">
        <Sprout className="size-[18px] text-success-strong" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-body-sm font-bold text-ink">
          Your Garden: {garden.stageName}
          {garden.titleName ? ` · ${garden.titleName}` : ""}
        </span>
        <span className="block truncate text-caption text-ink-muted">
          {started
            ? garden.tendedThisWeek
              ? `${garden.uniqueReady} ${garden.uniqueReady === 1 ? "person" : "people"} ready. Tended this week`
              : `${garden.uniqueReady} ${garden.uniqueReady === 1 ? "person" : "people"} ready. Tap to tend it this week`
            : "Start a Pod and watch it grow"}
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-ink-faint" aria-hidden />
    </Link>
  );
}
