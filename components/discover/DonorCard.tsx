import { MapPin } from "lucide-react";
import { BloodTypeBadge } from "@/components/ui/BloodTypeBadge";
import { cn } from "@/lib/utils";
import type { DiscoverDonor } from "@/lib/discover-data";

export function formatDistance(km: number | null) {
  if (km === null) return null;
  if (km < 2) return "Under 2 km away";
  return `About ${Math.round(km)} km away`;
}

/** One search result: blood type, area, distance. Nothing that says who the person is. */
export function DonorCard({ donor, active, onClick }: { donor: DiscoverDonor; active?: boolean; onClick?: () => void }) {
  const distance = formatDistance(donor.distanceKm);

  return (
    <button
      type="button"
      onClick={onClick}
      title={donor.isCompatibleMatch ? "Compatible with your blood type" : undefined}
      className={cn(
        "flex w-full items-center gap-3 rounded-3xl border-[0.5px] border-hairline bg-card lg:rounded-2xl p-3.5 text-left shadow-raised transition-colors duration-150 hover:border-red lg:p-4",
        (donor.isCompatibleMatch || active) && "ring-2 ring-red/20",
        active && "border-red",
      )}
    >
      <BloodTypeBadge bloodType={donor.bloodType} size="md" className={donor.isCompatibleMatch ? "bg-red" : undefined} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-body-sm font-bold text-ink">{donor.city ?? "Area not set"}</p>
        <p className="mt-0.5 flex items-center gap-1 truncate text-caption text-ink-muted">
          <MapPin className="size-3 shrink-0" />
          {distance ?? "Distance unknown"}
        </p>
      </div>
      {donor.isCompatibleMatch && (
        <span className="shrink-0 rounded-full bg-red-light px-2 py-0.5 text-label font-bold text-red-fg">Matches you</span>
      )}
    </button>
  );
}
