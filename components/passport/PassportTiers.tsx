import { cn } from "@/lib/utils";
import type { PassportTier } from "@prisma/client";

const TIERS: { id: PassportTier; name: string; range: string }[] = [
  { id: "STARTER", name: "Starter", range: "0–4" },
  { id: "VERIFIED", name: "Verified", range: "5–24" },
  { id: "LEGEND", name: "Legend", range: "25+" },
];

export function PassportTiers({ currentTier }: { currentTier: PassportTier }) {
  return (
    <div className="mx-2.5 flex gap-1.5 lg:mx-6 lg:gap-2.5">
      {TIERS.map((tier) => {
        const isCurrent = tier.id === currentTier;
        const isLegend = tier.id === "LEGEND";

        return (
          <div
            key={tier.id}
            className={cn(
              "flex-1 rounded-[10px] py-[9px] text-center lg:rounded-xl lg:py-4",
              isCurrent && !isLegend && "border-[1.5px] border-red bg-red-light",
              isCurrent && isLegend && "border-[1.5px] border-[#FFD700] bg-[#2A2410]",
              !isCurrent && "bg-surface",
            )}
          >
            <p
              className={cn(
                "text-[9px] font-bold lg:text-[11px]",
                isCurrent && !isLegend && "text-red",
                isCurrent && isLegend && "text-[#FFD700]",
                !isCurrent && "text-ink-muted",
              )}
            >
              {tier.name}
            </p>
            <p
              className={cn(
                "text-sm font-extrabold lg:text-lg",
                isCurrent && !isLegend && "text-red",
                isCurrent && isLegend && "text-[#FFD700]",
                !isCurrent && "text-ink-faint",
              )}
            >
              {tier.range}
            </p>
            {isCurrent && (
              <p
                className="text-[8px] lg:text-[10px]"
                style={{ color: isLegend ? "#FFD700" : "#DD0000" }}
              >
                you are here
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
