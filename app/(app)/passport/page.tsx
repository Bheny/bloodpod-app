import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ChevronDown, Clock, Flame, ShieldQuestion } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPassportData } from "@/lib/passport-data";
import { daysLeftInQuarter as calcDaysLeftInQuarter } from "@/lib/passport";
import { formatDate } from "@/lib/formatters";
import { daysUntil } from "@/lib/eligibility";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { PassportCard } from "@/components/passport/PassportCard";
import { PassportTiers } from "@/components/passport/PassportTiers";
import { DonationHistory } from "@/components/passport/DonationHistory";
import { cn } from "@/lib/utils";

export default async function PassportPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardingComplete) redirect("/onboarding");

  const data = await getPassportData(user.id);
  if (!data) redirect("/sign-in");

  const { passport, donations } = data;

  const daysLeftInQuarter = passport.lastDonated ? calcDaysLeftInQuarter(new Date(passport.lastDonated)) : null;
  const streakAtRisk = passport.streak > 0 && daysLeftInQuarter !== null && daysLeftInQuarter < 14;
  const totalSlots = Math.max(passport.streak + 3, 4);

  const daysToEligible = !passport.isEligible && passport.nextEligible ? daysUntil(passport.nextEligible) : null;

  return (
    <div>
      <AppHeader
        wide
        title="Blood Card"
        subtitle="Your blood type and eligibility, always with you"
        actions={
          <Link
            href="/passport/log"
            className="hidden rounded-full bg-red px-4 py-2.5 text-body-sm font-bold text-white transition-transform active:scale-95 lg:block"
          >
            Log donation
          </Link>
        }
      />

      <div className="flex flex-col gap-3.5 px-3.5 pb-8 pt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-6 lg:px-0 lg:pt-0">
        <div className="contents lg:flex lg:flex-col lg:gap-6">
          <div className="order-1 lg:order-none">
            <PassportCard
              name={data.user.name}
              city={data.user.city}
              bloodType={data.user.bloodType}
              donationCount={passport.donationCount}
              podCount={data.user.podsJoined}
              isEligible={passport.isEligible}
              nextEligible={passport.nextEligible}
              verificationStatus={passport.verificationStatus}
            />
          </div>

          <div className="order-4 lg:order-none">
            <DonationHistory donations={donations} totalCount={donations.length} limit={5} />
          </div>

          <div className="order-5 lg:order-none">
            {/* Tiers and streaks are parked until trust and emergency response are proven. */}
            <details className="group rounded-2xl border-[0.5px] border-hairline bg-white shadow-raised">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-4 lg:px-6">
                <span>
                  <span className="block text-body-sm font-bold text-ink lg:text-title">Milestones</span>
                  <span className="block text-caption text-ink-muted">Tiers and your donation streak</span>
                </span>
                <ChevronDown className="size-5 text-ink-faint transition-transform group-open:rotate-180" />
              </summary>

              <div className="space-y-4 border-t-[0.5px] border-hairline px-4 py-4 lg:px-6 lg:py-5">
                <PassportTiers currentTier={passport.tier} />

                {passport.donationCount >= 1 && (
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-body-sm font-bold text-ink">Donation streak</p>
                        <p className="text-caption text-ink-muted">{passport.streak}-quarter streak</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Flame className="size-5 text-red" />
                        <span className="text-2xl font-extrabold text-red">{passport.streak}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      {Array.from({ length: totalSlots }).map((_, i) => {
                        const isPast = i < passport.streak;
                        const isCurrent = i === passport.streak;
                        return (
                          <span
                            key={i}
                            className={cn(
                              "flex size-8 items-center justify-center rounded-full border text-caption",
                              isPast && "border-red bg-red text-white",
                              isCurrent && "border-dashed border-red-mid text-red",
                              !isPast && !isCurrent && "border-hairline bg-surface",
                            )}
                          >
                            {isPast ? "✓" : isCurrent ? "…" : ""}
                          </span>
                        );
                      })}
                    </div>

                    {streakAtRisk && (
                      <p className="mt-3 rounded-xl bg-red-light px-3 py-2 text-caption font-bold text-red">
                        Donate in {daysLeftInQuarter} day{daysLeftInQuarter === 1 ? "" : "s"} to keep your{" "}
                        {passport.streak}-quarter streak
                      </p>
                    )}
                  </div>
                )}
              </div>
            </details>
          </div>
        </div>

        <div className="contents lg:sticky lg:top-8 lg:flex lg:flex-col lg:gap-6">
          <div className="order-2 lg:order-none">
            <Card>
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full",
                    passport.isEligible ? "bg-[#F0FBF3]" : "bg-surface",
                  )}
                >
                  {passport.isEligible ? (
                    <CheckCircle2 className="size-5 text-[#1FA855]" />
                  ) : (
                    <Clock className="size-5 text-[#F59E0B]" />
                  )}
                </span>
                <div>
                  <p className="text-body-sm font-bold text-ink lg:text-title">
                    {passport.isEligible ? "You can donate now" : `Eligible again in ${daysToEligible} day${daysToEligible === 1 ? "" : "s"}`}
                  </p>
                  <p className="mt-0.5 text-caption text-ink-muted lg:text-body-sm">
                    {passport.isEligible
                      ? "You are on the list if your blood type is needed near you."
                      : `Back on ${passport.nextEligible ? formatDate(passport.nextEligible) : "—"}. We won't alert you until then.`}
                  </p>
                </div>
              </div>
              <Link
                href="/passport/log"
                className="mt-4 block rounded-full bg-red py-3 text-center text-body-sm font-bold text-white transition-transform active:scale-95 lg:hidden"
              >
                Log a donation
              </Link>
            </Card>
          </div>

          <div className="order-3 lg:order-none">
            <Card>
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface">
                  <ShieldQuestion className="size-5 text-ink-mid" />
                </span>
                <div>
                  <CardTitle>Not verified yet</CardTitle>
                  <p className="mt-1 text-caption leading-relaxed text-ink-muted lg:text-body-sm">
                    Your card shows what you told us. Lab verification, where a reviewer checks a lab report against
                    your profile, is coming with the pilot. It reduces risk but never replaces the hospital&apos;s own
                    testing.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
