import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { BloodTypeBadge } from "@/components/ui/BloodTypeBadge";
import { TIER_STYLES } from "@/components/ui/TierBadge";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/formatters";
import type { DiscoverDonor } from "@/lib/discover-data";

function readinessStatus(donor: DiscoverDonor) {
  if (donor.isEligible && donor.isAvailable) {
    return { label: "Ready to help now", color: "#166534", bg: "#F0FDF4" };
  }
  if (donor.isEligible) {
    return { label: "Eligible, not available now", color: "#8E8E93", bg: "#F2F2F2" };
  }
  return {
    label: donor.nextEligible ? `Eligible from ${formatDate(donor.nextEligible)}` : "Not yet eligible",
    color: "#92400E",
    bg: "#FFFBEB",
  };
}

export function DonorCard({ donor }: { donor: DiscoverDonor }) {
  const tier = TIER_STYLES[donor.tier];
  const isVerifiedTier = donor.tier !== "STARTER";
  const readiness = readinessStatus(donor);

  return (
    <Link
      href={`/discover/donor/${donor.id}`}
      title={donor.isCompatibleMatch ? "Compatible with your blood type" : undefined}
      aria-label={
        donor.isCompatibleMatch
          ? `${donor.displayName}, compatible with your blood type`
          : donor.displayName
      }
      className={cn(
        "flex flex-col items-center gap-3 rounded-2xl border-[0.5px] border-hairline bg-white p-5 text-center shadow-raised transition-colors duration-150 hover:border-red",
        donor.isCompatibleMatch && "ring-2 ring-red/20",
      )}
    >
      <div className="relative">
        <div
          className={cn(
            "rounded-full p-[3px]",
            donor.isAvailable ? "bg-gradient-to-br from-[#34C759] to-[#0A8F3C]" : "bg-hairline",
          )}
        >
          {donor.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL, not a local optimizable asset
            <img
              src={donor.avatarUrl}
              alt={donor.displayName}
              className="size-16 rounded-full border-2 border-white object-cover"
            />
          ) : (
            <span
              style={{ backgroundColor: donor.bgColor, color: donor.textColor }}
              className="flex size-16 items-center justify-center rounded-full border-2 border-white text-lg font-bold"
            >
              {donor.initials}
            </span>
          )}
        </div>

        {isVerifiedTier && (
          <span
            className="absolute -bottom-0.5 -right-0.5 flex size-6 items-center justify-center rounded-full border-2 border-white"
            style={{ backgroundColor: tier.color }}
          >
            <BadgeCheck className="size-3.5 text-white" />
          </span>
        )}
      </div>

      <div>
        <div className="flex items-center justify-center gap-1.5">
          <p className="truncate text-body-sm font-bold text-ink">{donor.displayName}</p>
          <BloodTypeBadge
            bloodType={donor.bloodType}
            size="sm"
            className={donor.isCompatibleMatch ? "bg-red" : undefined}
          />
        </div>
        <p className="truncate text-label text-ink-muted">
          {donor.city ?? "Unknown city"}
          {donor.distanceKm !== null && ` · ${donor.distanceKm.toFixed(1)} km away`}
        </p>
      </div>

      <div className="grid w-full grid-cols-2 border-t-[0.5px] border-hairline pt-3">
        <div>
          <p className="truncate text-body-sm font-extrabold text-ink">{donor.donationCount}</p>
          <p className="text-label text-ink-muted">Donations</p>
        </div>
        <div className="border-l-[0.5px] border-hairline">
          <p className="truncate text-body-sm font-extrabold" style={{ color: tier.color }}>
            {tier.label}
          </p>
          <p className="text-label text-ink-muted">Tier</p>
        </div>
      </div>

      <div
        className="flex w-full items-center justify-center gap-1.5 rounded-full px-3 py-1.5"
        style={{ backgroundColor: readiness.bg }}
      >
        <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: readiness.color }} />
        <span className="truncate text-label font-bold" style={{ color: readiness.color }}>
          {readiness.label}
        </span>
      </div>
    </Link>
  );
}
