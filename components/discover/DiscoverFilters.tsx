"use client";

import { MapPin } from "lucide-react";
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
      <p className="text-label font-bold uppercase tracking-wide text-ink-muted">Blood type</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5 lg:gap-2">
        <button
          type="button"
          onClick={() => onBloodTypeChange("")}
          className={cn(
            "shrink-0 rounded-full px-3 py-1.5 text-label font-bold transition-colors lg:px-4 lg:py-2 lg:text-body-sm",
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
              "shrink-0 rounded-full px-3 py-1.5 text-label font-bold transition-colors lg:px-4 lg:py-2 lg:text-body-sm",
              bloodType === value ? "bg-red text-white" : "bg-surface text-ink-muted",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="mt-3 text-label font-bold uppercase tracking-wide text-ink-muted">Location</p>
      <div className="mt-1.5 flex items-center gap-2">
        <div className="relative flex-1">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
          <Input
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            placeholder="Search any city"
            className="py-2.5 pl-9 text-xs lg:py-3 lg:text-sm"
          />
        </div>
        {myCity && (
          <button
            type="button"
            onClick={() => onCityChange(myCity)}
            className={cn(
              "shrink-0 rounded-full px-3 py-2.5 text-label font-bold transition-colors lg:px-4 lg:py-3 lg:text-body-sm",
              city === myCity ? "bg-red text-white" : "bg-red-light text-red",
            )}
          >
            Near me
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => onEligibleOnlyChange(!eligibleOnly)}
        className={cn(
          "mt-3 rounded-full px-3 py-1.5 text-label font-bold transition-colors lg:px-4 lg:py-2 lg:text-body-sm",
          eligibleOnly ? "bg-[#166534] text-white" : "bg-surface text-ink-muted",
        )}
      >
        Eligible now only
      </button>
    </div>
  );
}
