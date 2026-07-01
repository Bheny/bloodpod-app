import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Pencil, Bell, Wallet, HeartPulse } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPassportData } from "@/lib/passport-data";
import { BLOOD_TYPE_LABELS } from "@/lib/blood-type";
import { getInitials } from "@/lib/formatters";
import { VisibilityRow } from "@/components/profile/VisibilityRow";
import { AvailabilityRow } from "@/components/profile/AvailabilityRow";
import { SignOutButton } from "@/components/profile/SignOutButton";
import { JoinByCodeForm } from "@/components/invite/JoinByCodeForm";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardingComplete) redirect("/onboarding");

  const passportData = await getPassportData(user.id);

  return (
    <div>
      <div className="border-b-[0.5px] border-hairline bg-white px-4 py-3.5 lg:px-6 lg:py-5">
        <h1 className="text-body-sm font-extrabold tracking-[-0.4px] text-ink lg:text-title">
          Profile
        </h1>
      </div>

      <div className="flex flex-col items-center gap-2 px-4 py-6 lg:py-8">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL, not a local optimizable asset
          <img
            src={user.avatarUrl}
            alt={user.name ?? "Profile photo"}
            className="size-16 rounded-full object-cover lg:size-20"
          />
        ) : (
          <span className="flex size-16 items-center justify-center rounded-full bg-red text-xl font-bold text-white lg:size-20 lg:text-2xl">
            {user.name ? getInitials(user.name) : "?"}
          </span>
        )}
        <p className="text-base font-extrabold text-ink lg:text-lg">
          {user.name ?? "BloodPod member"}
        </p>
        <p className="text-xs text-ink-muted lg:text-sm">{user.email}</p>
        <p className="text-label text-ink-faint lg:text-body-sm">
          {user.bloodType ? BLOOD_TYPE_LABELS[user.bloodType] : "No blood type"} ·{" "}
          {user.city ?? "No city set"} · {user.plan === "PREMIUM" ? "Pod Pro" : "Free"}
        </p>
      </div>

      <div className="flex flex-col gap-2.5 px-4 pb-4 lg:px-6 lg:pb-6">
        <Link
          href="/passport"
          className="flex items-center gap-3 rounded-2xl bg-ink px-3.5 py-3.5 shadow-raised lg:px-5 lg:py-4"
        >
          <div className="min-w-0 flex-1">
            <p className="text-label font-bold uppercase tracking-wide text-white/45">
              Donation passport
            </p>
            <p className="mt-1 text-sm font-extrabold text-white lg:text-base">
              {passportData?.passport.donationCount ?? 0} donation
              {passportData?.passport.donationCount === 1 ? "" : "s"} ·{" "}
              {passportData?.passport.tier ?? "STARTER"}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-white/10 px-3 py-2 text-label font-bold text-white">
            View Passport
          </span>
        </Link>

        <VisibilityRow initiallyPublic={user.isPublic} />

        <AvailabilityRow initiallyAvailable={user.isAvailable} />

        <JoinByCodeForm />

        <Link
          href="/essentials"
          className="flex items-center gap-2.5 rounded-2xl border-[0.5px] border-hairline bg-white px-3.5 py-3 shadow-raised lg:px-5 lg:py-4"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-surface lg:size-10">
            <Wallet className="size-4 text-ink-mid lg:size-5" />
          </span>
          <span className="flex-1 text-caption font-bold text-ink lg:text-body-sm">My Essentials</span>
          <ChevronRight className="size-4 text-ink-faint" />
        </Link>

        <Link
          href="/medical-history"
          className="flex items-center gap-2.5 rounded-2xl border-[0.5px] border-hairline bg-white px-3.5 py-3 shadow-raised lg:px-5 lg:py-4"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-surface lg:size-10">
            <HeartPulse className="size-4 text-ink-mid lg:size-5" />
          </span>
          <span className="flex-1 text-caption font-bold text-ink lg:text-body-sm">Medical History</span>
          <ChevronRight className="size-4 text-ink-faint" />
        </Link>

        <Link
          href="/profile/edit"
          className="flex items-center gap-2.5 rounded-2xl border-[0.5px] border-hairline bg-white px-3.5 py-3 shadow-raised lg:px-5 lg:py-4"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-surface lg:size-10">
            <Pencil className="size-4 text-ink-mid lg:size-5" />
          </span>
          <span className="flex-1 text-caption font-bold text-ink lg:text-body-sm">Edit profile</span>
          <ChevronRight className="size-4 text-ink-faint" />
        </Link>

        <Link
          href="/profile/notifications"
          className="flex items-center gap-2.5 rounded-2xl border-[0.5px] border-hairline bg-white px-3.5 py-3 shadow-raised lg:px-5 lg:py-4"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-surface lg:size-10">
            <Bell className="size-4 text-ink-mid lg:size-5" />
          </span>
          <span className="flex-1 text-caption font-bold text-ink lg:text-body-sm">Notifications</span>
          <ChevronRight className="size-4 text-ink-faint" />
        </Link>

        <SignOutButton />
      </div>
    </div>
  );
}
