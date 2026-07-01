import type { PassportTier } from "@prisma/client";
import { cn } from "@/lib/utils";

export const TIER_STYLES: Record<PassportTier, { label: string; color: string }> = {
  STARTER: { label: "Starter", color: "#8E8E93" },
  VERIFIED: { label: "Verified", color: "#166534" },
  LEGEND: { label: "Legend", color: "#B8860B" },
};

export function TierBadge({ tier, className }: { tier: PassportTier; className?: string }) {
  const style = TIER_STYLES[tier];
  return (
    <span
      className={cn("rounded-full px-2 py-0.5 text-label font-bold", className)}
      style={{ backgroundColor: `${style.color}1A`, color: style.color }}
    >
      {style.label}
    </span>
  );
}
