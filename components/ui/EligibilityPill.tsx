import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/formatters";

export function EligibilityPill({
  isEligible,
  nextEligible,
  className,
}: {
  isEligible: boolean;
  nextEligible: Date | string | null;
  className?: string;
}) {
  if (isEligible) {
    return (
      <span
        className={cn(
          "rounded-full bg-[#F0FDF4] px-2 py-0.5 text-[10px] font-bold text-[#166534]",
          className,
        )}
      >
        Eligible
      </span>
    );
  }

  return (
    <span
      className={cn(
        "rounded-full bg-[#FFFBEB] px-2 py-0.5 text-[10px] font-bold text-[#92400E]",
        className,
      )}
    >
      {nextEligible ? `Eligible ${formatDate(nextEligible)}` : "Not yet eligible"}
    </span>
  );
}
