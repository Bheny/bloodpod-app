import Link from "next/link";
import { BloodTypeBadge } from "@/components/ui/BloodTypeBadge";
import { EligibilityPill } from "@/components/ui/EligibilityPill";
import type { DiscoverDonor } from "@/lib/discover-data";

export function DonorCard({ donor }: { donor: DiscoverDonor }) {
  return (
    <Link
      href={`/discover/donor/${donor.id}`}
      className="flex items-center gap-3 rounded-2xl border-[0.5px] border-[#E5E5EA] bg-white px-3.5 py-3 transition-colors duration-150 hover:border-red"
    >
      <span
        style={{ backgroundColor: donor.bgColor, color: donor.textColor }}
        className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
      >
        {donor.initials}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[12px] font-bold text-ink">{donor.displayName}</p>
          {donor.isAvailable && <span className="size-1.5 shrink-0 rounded-full bg-[#34C759]" />}
        </div>
        <p className="truncate text-[10px] text-ink-muted">
          {donor.city ?? "Unknown city"}
          {donor.distanceKm !== null && ` · ${donor.distanceKm.toFixed(1)} km`}
          {" · "}
          {donor.donationCount} donation{donor.donationCount === 1 ? "" : "s"}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <BloodTypeBadge bloodType={donor.bloodType} size="sm" />
        <EligibilityPill isEligible={donor.isEligible} nextEligible={donor.nextEligible} />
      </div>
    </Link>
  );
}
