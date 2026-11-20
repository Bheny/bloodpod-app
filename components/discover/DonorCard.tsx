import { MapPin } from "lucide-react";
import { BloodTypeBadge } from "@/components/ui/BloodTypeBadge";
import { cn } from "@/lib/utils";
import type { DiscoverDonor } from "@/lib/discover-data";
import { AskButton } from "@/components/discover/AskButton";

export function formatDistance(km: number | null) {
  if (km === null) return null;
  if (km < 2) return "Under 2 km away";
  return `About ${Math.round(km)} km away`;
}

/**
 * One search result: blood type, area, distance. A first name shows only for people who chose to be
 * listed by name, and only they can be asked for help. Nothing else says who the person is.
 */
export function DonorCard({ donor, active, onClick }: { donor: DiscoverDonor; active?: boolean; onClick?: () => void }) {
  const distance = formatDistance(donor.distanceKm);

  return (
    <div
      title={donor.isCompatibleMatch ? "Compatible with your blood type" : undefined}
      className={cn(
        "w-full rounded-3xl border-[0.5px] border-hairline bg-card lg:rounded-2xl p-3.5 text-left shadow-raised transition-colors duration-150 hover:border-red lg:p-4",
        (donor.isCompatibleMatch || active) && "ring-2 ring-red/20",
        active && "border-red",
      )}
    >
      <button type="button" onClick={onClick} className="flex w-full items-center gap-3 text-left">
        <BloodTypeBadge bloodType={donor.bloodType} size="md" className={donor.isCompatibleMatch ? "bg-red" : undefined} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-body-sm font-bold text-ink">{donor.firstName ?? donor.city ?? "Area not set"}</p>
          <p className="mt-0.5 flex items-center gap-1 truncate text-caption text-ink-muted">
            <MapPin className="size-3 shrink-0" />
            {[donor.firstName ? donor.city : null, distance ?? "Distance unknown"].filter(Boolean).join(" · ")}
          </p>
        </div>
        {donor.isCompatibleMatch && (
          <span className="shrink-0 rounded-full bg-red-light px-2 py-0.5 text-label font-bold text-red-fg">Matches you</span>
        )}
      </button>
      {donor.askId && <AskButton donorId={donor.askId} firstName={donor.firstName} />}
    </div>
  );
}
