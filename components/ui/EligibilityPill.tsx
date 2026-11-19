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
          "rounded-full bg-success-soft px-2 py-0.5 text-label font-bold text-success-strong",
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
        "rounded-full bg-[#FFFBEB] px-2 py-0.5 text-label font-bold text-warn-strong",
        className,
      )}
    >
      {nextEligible ? `Eligible ${formatDate(nextEligible)}` : "Not yet eligible"}
    </span>
  );
}
