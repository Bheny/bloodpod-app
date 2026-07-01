"use client";

import { Input } from "@/components/ui/Input";
import { BLOOD_TYPE_LABELS } from "@/lib/blood-type";
import { cn } from "@/lib/utils";
import type { BloodType } from "@prisma/client";

const BLOOD_TYPES = Object.entries(BLOOD_TYPE_LABELS) as [BloodType, string][];

export function DiscoverFilters({
  bloodType,
  onBloodTypeChange,
  city,
  onCityChange,
  eligibleOnly,
  onEligibleOnlyChange,
  myCity,
}: {
  bloodType: BloodType | "";
  onBloodTypeChange: (value: BloodType | "") => void;
  city: string;
  onCityChange: (value: string) => void;
  eligibleOnly: boolean;
  onEligibleOnlyChange: (value: boolean) => void;
  myCity: string | null;
}) {
  return (
    <div className="bg-white px-4 py-3 lg:px-6 lg:py-4">
      <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 lg:mx-0 lg:gap-2 lg:px-0">
        <button
          type="button"
          onClick={() => onBloodTypeChange("")}
          className={cn(
            "shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors lg:px-4 lg:py-2 lg:text-[13px]",
            bloodType === "" ? "bg-ink text-white" : "bg-surface text-ink-muted",
          )}
        >
          All types
        </button>
        {BLOOD_TYPES.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => onBloodTypeChange(value)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors lg:px-4 lg:py-2 lg:text-[13px]",
              bloodType === value ? "bg-red text-white" : "bg-surface text-ink-muted",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-2.5 flex items-center gap-2 lg:mt-3">
        <Input
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          placeholder="Filter by city"
          className="flex-1 py-2.5 text-xs lg:py-3 lg:text-sm"
        />
        {myCity && city !== myCity && (
          <button
            type="button"
            onClick={() => onCityChange(myCity)}
            className="shrink-0 rounded-full bg-red-light px-3 py-2.5 text-[11px] font-bold text-red lg:px-4 lg:py-3 lg:text-[13px]"
          >
            Near me
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => onEligibleOnlyChange(!eligibleOnly)}
        className={cn(
          "mt-2 rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors lg:px-4 lg:py-2 lg:text-[13px]",
          eligibleOnly ? "bg-[#166534] text-white" : "bg-surface text-ink-muted",
        )}
      >
        Eligible now only
      </button>
    </div>
  );
}
