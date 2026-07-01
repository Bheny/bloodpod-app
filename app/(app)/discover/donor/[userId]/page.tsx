import { redirect } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getDonorDetail } from "@/lib/discover-data";
import { formatDate } from "@/lib/formatters";
import { AppHeader } from "@/components/layout/AppHeader";
import { BloodTypeBadge } from "@/components/ui/BloodTypeBadge";
import { TIER_STYLES } from "@/components/ui/TierBadge";
import { cn } from "@/lib/utils";

function readinessStatus(donor: { isEligible: boolean; isAvailable: boolean; nextEligible: Date | null }) {
  if (donor.isEligible && donor.isAvailable) {
    return { label: "Ready to help now", color: "#166534", bg: "#F0FDF4" };
  }
  if (donor.isEligible) {
    return { label: "Eligible, not available right now", color: "#8E8E93", bg: "#F2F2F2" };
  }
  return {
    label: donor.nextEligible ? `Eligible from ${formatDate(donor.nextEligible)}` : "Not yet eligible",
    color: "#92400E",
    bg: "#FFFBEB",
  };
}

export default async function DonorProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardingComplete) redirect("/onboarding");

  const donor = await getDonorDetail(userId, user.id);

  if (!donor) {
    return (
      <div>
        <AppHeader title="Donor profile" backHref="/discover" />
        <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
          <p className="text-sm font-bold text-ink">This profile isn&apos;t available.</p>
          <p className="max-w-xs text-xs text-ink-muted">
            They may have turned off visibility, or this profile doesn&apos;t exist.
          </p>
        </div>
      </div>
    );
  }

  const tier = TIER_STYLES[donor.tier];
  const isVerifiedTier = donor.tier !== "STARTER";
  const readiness = readinessStatus(donor);

  return (
    <div>
      <AppHeader title="Donor profile" backHref="/discover" />

      <div className="flex flex-col items-center gap-4 px-6 py-8 text-center">
        <div className="relative">
          <div
            className={cn(
              "rounded-full p-1",
              donor.isAvailable ? "bg-gradient-to-br from-[#34C759] to-[#0A8F3C]" : "bg-hairline",
            )}
          >
            {donor.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL, not a local optimizable asset
              <img
                src={donor.avatarUrl}
                alt={donor.displayName}
                className="size-24 rounded-full border-4 border-white object-cover"
              />
            ) : (
              <span
                style={{ backgroundColor: donor.bgColor, color: donor.textColor }}
                className="flex size-24 items-center justify-center rounded-full border-4 border-white text-3xl font-bold"
              >
                {donor.initials}
              </span>
            )}
          </div>

          {isVerifiedTier && (
            <span
              className="absolute bottom-1 right-1 flex size-8 items-center justify-center rounded-full border-2 border-white"
              style={{ backgroundColor: tier.color }}
            >
              <BadgeCheck className="size-4.5 text-white" />
            </span>
          )}
        </div>

        <div>
          <div className="flex items-center justify-center gap-2">
            <p className="text-title font-extrabold text-ink">{donor.displayName}</p>
            <BloodTypeBadge
              bloodType={donor.bloodType}
              className={donor.isCompatibleMatch ? "bg-red" : undefined}
              title={donor.isCompatibleMatch ? "Compatible with your blood type" : undefined}
            />
          </div>
          <p className="mt-1 text-body-sm text-ink-muted">
            {donor.city ?? "Unknown city"}
            {donor.distanceKm !== null && ` · ${donor.distanceKm.toFixed(1)} km away`}
          </p>
          <p className="mt-1 text-label text-ink-faint">
            Member since {formatDate(donor.memberSince)}
          </p>
        </div>

        <div
          className="flex w-full max-w-xs items-center justify-center gap-1.5 rounded-full px-4 py-2"
          style={{ backgroundColor: readiness.bg }}
        >
          <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: readiness.color }} />
          <span className="text-label font-bold" style={{ color: readiness.color }}>
            {readiness.label}
          </span>
        </div>

        <div className="grid w-full max-w-xs grid-cols-2 rounded-2xl border-[0.5px] border-hairline bg-white py-4 shadow-raised">
          <div>
            <p className="text-title-lg font-extrabold text-ink">{donor.donationCount}</p>
            <p className="text-label text-ink-muted">
              Donation{donor.donationCount === 1 ? "" : "s"}
            </p>
          </div>
          <div className="border-l-[0.5px] border-hairline">
            <p className="text-title-lg font-extrabold" style={{ color: tier.color }}>
              {tier.label}
            </p>
            <p className="text-label text-ink-muted">Tier</p>
          </div>
        </div>

        <p className="max-w-xs text-label text-ink-faint">
          Direct messaging isn&apos;t available yet - this is a read-only public profile.
        </p>
      </div>
    </div>
  );
}
