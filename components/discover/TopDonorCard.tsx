import Link from "next/link";
import { BloodTypeBadge } from "@/components/ui/BloodTypeBadge";
import type { TopDonor } from "@/lib/discover-highlights";

const TIER_STYLES: Record<string, { label: string; color: string }> = {
  STARTER: { label: "Starter", color: "#8E8E93" },
  VERIFIED: { label: "Verified", color: "#DD0000" },
  LEGEND: { label: "Legend", color: "#B8860B" },
};

export function TopDonorCard({ donor, rank }: { donor: TopDonor; rank: number }) {
  const tier = TIER_STYLES[donor.tier] ?? TIER_STYLES.STARTER;

  return (
    <Link
      href={`/discover/donor/${donor.id}`}
      className="relative flex w-[104px] shrink-0 snap-start flex-col items-center gap-1.5 rounded-2xl border-[0.5px] border-[#E5E5EA] bg-white px-2.5 py-3.5 text-center lg:w-[136px] lg:py-5"
    >
      <span className="absolute left-2 top-2 flex size-5 items-center justify-center rounded-full bg-ink text-[9px] font-bold text-white lg:size-6 lg:text-[11px]">
        {rank}
      </span>

      {donor.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL, not a local optimizable asset
        <img
          src={donor.avatarUrl}
          alt={donor.displayName}
          className="size-11 rounded-full object-cover lg:size-14"
        />
      ) : (
        <span
          style={{ backgroundColor: donor.bgColor, color: donor.textColor }}
          className="flex size-11 items-center justify-center rounded-full text-sm font-bold lg:size-14 lg:text-base"
        >
          {donor.initials}
        </span>
      )}

      <p className="line-clamp-1 text-[10px] font-bold text-ink lg:text-[12px]">
        {donor.displayName}
      </p>
      <BloodTypeBadge bloodType={donor.bloodType} size="sm" />
      <p className="text-[9px] text-ink-muted lg:text-[11px]">
        {donor.donationCount} donation{donor.donationCount === 1 ? "" : "s"}
      </p>
      <p className="text-[8px] font-bold lg:text-[10px]" style={{ color: tier.color }}>
        {tier.label}
      </p>
    </Link>
  );
}
