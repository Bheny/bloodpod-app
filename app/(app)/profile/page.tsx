import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Pencil, Bell, Wallet, HeartPulse, IdCard, MapPin, Shield, type LucideIcon } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPassportData } from "@/lib/passport-data";
import { BLOOD_TYPE_LABELS } from "@/lib/blood-type";
import { getInitials } from "@/lib/formatters";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card } from "@/components/ui/Card";
import { AvailabilityRow } from "@/components/profile/AvailabilityRow";
import { SignOutButton } from "@/components/profile/SignOutButton";
import { JoinByCodeForm } from "@/components/invite/JoinByCodeForm";
import { PushToggle } from "@/components/pwa/PushToggle";
import { isAdminEmail } from "@/lib/admin/auth";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="px-1 text-caption font-bold uppercase tracking-wide text-ink-muted">{children}</h2>;
}

function LinkRow({
  href,
  icon: Icon,
  label,
  hint,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  hint?: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl border-[0.5px] border-hairline bg-white px-4 py-3.5 shadow-raised transition-colors hover:bg-surface"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface">
        <Icon className="size-5 text-ink-mid" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-body-sm font-bold text-ink">{label}</span>
        {hint && <span className="block text-caption text-ink-muted">{hint}</span>}
      </span>
      <ChevronRight className="size-4 shrink-0 text-ink-faint" />
    </Link>
  );
}

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user.hospitalId) redirect("/hospital");
  if (user.labId) redirect("/lab");
  if (!user.onboardingComplete) redirect("/onboarding");

  const passportData = await getPassportData(user.id);
  const donations = passportData?.passport.donationCount ?? 0;

  return (
    <div>
      <AppHeader wide title="Profile" subtitle="Your details, alerts and privacy" />

      <div className="flex flex-col gap-3.5 px-3.5 pb-8 pt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-6 lg:px-0 lg:pt-0">
        {/* Identity: first on phones, a sticky rail on desktop */}
        <div className="order-1 flex flex-col gap-3.5 lg:order-2 lg:sticky lg:top-8 lg:gap-6">
          <Card className="text-center">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL, not a local optimizable asset
              <img
                src={user.avatarUrl}
                alt={user.name ?? "Profile photo"}
                className="mx-auto size-20 rounded-full object-cover lg:size-24"
              />
            ) : (
              <span className="mx-auto flex size-20 items-center justify-center rounded-full bg-red text-2xl font-bold text-white lg:size-24 lg:text-3xl">
                {user.name ? getInitials(user.name) : "?"}
              </span>
            )}
            <p className="mt-3 text-title font-extrabold tracking-[-0.4px] text-ink lg:text-title-lg">
              {user.name ?? "BloodPod member"}
            </p>
            <p className="text-caption text-ink-muted lg:text-body-sm">{user.email}</p>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <span className="rounded-full bg-red-light px-3 py-1 text-caption font-bold text-red">
                {user.bloodType ? BLOOD_TYPE_LABELS[user.bloodType] : "No blood type"}
              </span>
              <span className="flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-caption font-semibold text-ink-mid">
                <MapPin className="size-3" /> {user.city ?? "No city set"}
              </span>
            </div>

            <Link
              href="/profile/edit"
              className="mt-4 flex items-center justify-center gap-2 rounded-full bg-surface py-2.5 text-body-sm font-bold text-ink transition-colors hover:bg-hairline"
            >
              <Pencil className="size-4" /> Edit profile
            </Link>
          </Card>

          <Link
            href="/passport"
            className="flex items-center gap-3 rounded-2xl bg-ink px-4 py-4 shadow-raised transition-transform active:scale-[0.98]"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-label font-bold uppercase tracking-wide text-white/70">Blood Card</span>
              <span className="mt-1 block text-body-sm font-extrabold text-white">
                {donations} donation{donations === 1 ? "" : "s"} logged
              </span>
            </span>
            <span className="shrink-0 rounded-full bg-white/10 px-3 py-2 text-caption font-bold text-white">View</span>
          </Link>

          <div className="hidden lg:block">
            <SignOutButton />
          </div>
        </div>

        {/* Settings, grouped */}
        <div className="order-2 flex flex-col gap-6 lg:order-1">
          <section className="flex flex-col gap-2.5">
            <SectionLabel>Emergency alerts</SectionLabel>
            <PushToggle />
            <AvailabilityRow initiallyAvailable={user.isAvailable} />
            <LinkRow href="/profile/notifications" icon={Bell} label="Notification settings" />
          </section>

          <section className="flex flex-col gap-2.5">
            <SectionLabel>Your details</SectionLabel>
            <LinkRow href="/medical-history" icon={HeartPulse} label="Medical history" hint="Allergies, genotype, emergency contact" />
            <LinkRow href="/essentials" icon={Wallet} label="My Essentials" hint="Cards and documents you keep handy" />
            <LinkRow href="/passport/history" icon={IdCard} label="Donation history" />
          </section>

          {isAdminEmail(user.email) && (
            <section className="flex flex-col gap-2.5">
              <SectionLabel>Founder</SectionLabel>
              <LinkRow href="/admin" icon={Shield} label="Admin dashboard" hint="Users, network, hospitals and finance" />
            </section>
          )}

          <section className="flex flex-col gap-2.5">
            <SectionLabel>Pods</SectionLabel>
            <JoinByCodeForm />
          </section>

          <div className="lg:hidden">
            <SignOutButton />
          </div>
        </div>
      </div>
    </div>
  );
}
