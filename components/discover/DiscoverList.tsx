"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { List, Map as MapIcon, Search } from "lucide-react";
import type { BloodType } from "@prisma/client";
import { DiscoverFilters } from "@/components/discover/DiscoverFilters";
import { DonorCard } from "@/components/discover/DonorCard";
import { PinMap, type MapPin } from "@/components/map/PinMap";
import { jsonFetcher } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import type { DiscoverDonor, DiscoverResult } from "@/lib/discover-data";

type View = "list" | "map";

export function DiscoverList({ initial, myCity }: { initial: DiscoverResult; myCity: string | null }) {
  const [bloodType, setBloodType] = useState<BloodType | "">("");
  const [city, setCity] = useState(myCity ?? "");
  const [eligibleOnly, setEligibleOnly] = useState(false);
  const [view, setView] = useState<View>("list");
  const [cell, setCell] = useState<string | null>(null);

  // Wait for the person to stop typing before searching.
  const [applied, setApplied] = useState({ bloodType: "" as BloodType | "", city: myCity ?? "", eligibleOnly: false });
  useEffect(() => {
    const timer = setTimeout(() => setApplied({ bloodType, city, eligibleOnly }), 350);
    return () => clearTimeout(timer);
  }, [bloodType, city, eligibleOnly]);

  const keyFor = (f: typeof applied) => {
    const params = new URLSearchParams();
    if (f.bloodType) params.set("bloodType", f.bloodType);
    if (f.city) params.set("city", f.city);
    if (f.eligibleOnly) params.set("eligibleOnly", "true");
    return `/api/discover?${params.toString()}`;
  };
  const key = keyFor(applied);
  const isInitialSearch = key === keyFor({ bloodType: "", city: myCity ?? "", eligibleOnly: false });

  // SWR caches each search, so going back to an earlier filter is instant, and the
  // previous results stay on screen while a new search loads.
  const { data, isLoading } = useSWR<DiscoverResult>(key, jsonFetcher, {
    fallbackData: isInitialSearch ? initial : undefined,
    keepPreviousData: true,
    revalidateOnFocus: false,
  });
  const donors = useMemo(() => data?.donors ?? [], [data]);
  const total = data?.total ?? 0;
  const me = data?.viewer.lat != null && data.viewer.lng != null ? { lat: data.viewer.lat, lng: data.viewer.lng } : null;

  // One pin per ~2 km square: its blood type when it's one person, otherwise a count.
  const pins = useMemo<MapPin[]>(() => {
    const cells = new Map<string, DiscoverDonor[]>();
    for (const d of donors) cells.set(d.cell, [...(cells.get(d.cell) ?? []), d]);
    return [...cells.entries()].map(([id, group]) => {
      const counts = new Map<string, number>();
      for (const d of group) counts.set(d.bloodType ?? "?", (counts.get(d.bloodType ?? "?") ?? 0) + 1);
      const summary = [...counts.entries()].map(([t, n]) => (n > 1 ? `${t} ×${n}` : t)).join(", ");
      return {
        id,
        lat: group[0].lat,
        lng: group[0].lng,
        label: group.length === 1 ? (group[0].bloodType ?? "?") : String(group.length),
        title: `${summary} · ${group[0].city ?? "this area"}`,
      };
    });
  }, [donors]);

  const shown = cell ? donors.filter((d) => d.cell === cell) : donors;

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
        <div className="flex items-center justify-between gap-3">
          <p className="text-label font-semibold text-ink-muted lg:text-body-sm">
            {isLoading ? "Searching..." : `${total} donor${total === 1 ? "" : "s"} found`}
          </p>
          <div className="flex rounded-full bg-surface p-0.5" role="tablist" aria-label="Results view">
            {(
              [
                ["list", "List", List],
                ["map", "Map", MapIcon],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={view === id}
                onClick={() => setView(id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-label font-bold transition-colors lg:text-body-sm",
                  view === id ? "bg-card text-ink shadow-raised" : "text-ink-muted",
                )}
              >
                <Icon className="size-3.5" /> {label}
              </button>
            ))}
          </div>
        </div>

        {view === "map" && (
          <div className="mt-3">
            <PinMap pins={pins} me={me} selectedId={cell} onSelect={setCell} />
            {!me && (
              <p className="mt-2 text-caption text-ink-muted">
                Add your location in your profile to see how far each pin is from you.
              </p>
            )}
          </div>
        )}

        {cell && (
          <button
            type="button"
            onClick={() => setCell(null)}
            className="mt-3 rounded-full bg-red-light px-3 py-1.5 text-label font-bold text-red-fg"
          >
            Showing {shown.length} in this area · Show all
          </button>
        )}

        {isLoading && donors.length === 0 ? (
          <div className="mt-2.5 flex flex-col gap-2 lg:grid lg:grid-cols-2 lg:gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[68px] animate-pulse rounded-2xl bg-surface" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <div className="mt-4 rounded-2xl bg-card px-6 py-10 text-center lg:py-14">
            <Search className="mx-auto size-9 text-ink-faint" />
            <p className="mt-3 text-body-sm font-bold text-ink">No donors match that search</p>
            <p className="mt-1 text-caption text-ink-muted">
              Try a different blood type or city, or check back later as more people join.
            </p>
          </div>
        ) : (
          <div className="mt-2.5 flex flex-col gap-2 lg:grid lg:grid-cols-2 lg:gap-3">
            {shown.map((donor) => (
              <DonorCard
                key={donor.key}
                donor={donor}
                active={donor.cell === cell}
                onClick={() => {
                  setCell(donor.cell);
                  setView("map");
                }}
              />
            ))}
          </div>
        )}

        {view === "list" && shown.length > 0 && (
          <p className="mt-4 text-caption text-ink-muted">
            Positions are only shown to about 2 km, and names and contact details are never shown.
          </p>
        )}
      </div>
    </div>
  );
}
