"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import type { BloodType } from "@prisma/client";
import { DiscoverFilters } from "@/components/discover/DiscoverFilters";
import { DonorCard } from "@/components/discover/DonorCard";
import type { DiscoverDonor } from "@/lib/discover-data";

export function DiscoverList({
  initialDonors,
  initialTotal,
  myCity,
}: {
  initialDonors: DiscoverDonor[];
  initialTotal: number;
  myCity: string | null;
}) {
  const [bloodType, setBloodType] = useState<BloodType | "">("");
  const [city, setCity] = useState(myCity ?? "");
  const [eligibleOnly, setEligibleOnly] = useState(false);
  const [donors, setDonors] = useState(initialDonors);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (bloodType) params.set("bloodType", bloodType);
      if (city) params.set("city", city);
      if (eligibleOnly) params.set("eligibleOnly", "true");

      try {
        const res = await fetch(`/api/discover?${params.toString()}`);
        const data = await res.json();
        setDonors(data.donors ?? []);
        setTotal(data.total ?? 0);
      } catch {
        // keep showing the previous results on a network hiccup
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [bloodType, city, eligibleOnly]);

  return (
    <div>
      <DiscoverFilters
        bloodType={bloodType}
        onBloodTypeChange={setBloodType}
        city={city}
        onCityChange={setCity}
        eligibleOnly={eligibleOnly}
        onEligibleOnlyChange={setEligibleOnly}
        myCity={myCity}
      />

      <div className="px-4 py-3 lg:px-6 lg:py-5">
        <p className="text-[11px] font-semibold text-ink-muted lg:text-[13px]">
          {loading ? "Searching..." : `${total} donor${total === 1 ? "" : "s"} found`}
        </p>

        {loading ? (
          <div className="mt-2.5 flex flex-col gap-2 lg:grid lg:grid-cols-2 lg:gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[68px] animate-pulse rounded-2xl bg-surface" />
            ))}
          </div>
        ) : donors.length === 0 ? (
          <div className="mt-4 rounded-2xl bg-white px-6 py-10 text-center lg:py-14">
            <Search className="mx-auto size-7 text-ink-faint lg:size-9" />
            <p className="mt-3 text-sm font-bold text-ink lg:text-base">No donors found.</p>
            <p className="mt-1 text-xs text-ink-muted lg:text-sm">
              Try a different blood type or city, or check back later as more people join.
            </p>
          </div>
        ) : (
          <div className="mt-2.5 flex flex-col gap-2 lg:grid lg:grid-cols-2 lg:gap-3">
            {donors.map((donor) => (
              <DonorCard key={donor.id} donor={donor} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
