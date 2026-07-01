import { redirect } from "next/navigation";
import Link from "next/link";
import { Flame } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPassportData } from "@/lib/passport-data";
import { daysLeftInQuarter as calcDaysLeftInQuarter } from "@/lib/passport";
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

  const daysLeftInQuarter = passport.lastDonated
    ? calcDaysLeftInQuarter(new Date(passport.lastDonated))
    : null;
  const streakAtRisk =
    passport.streak > 0 && daysLeftInQuarter !== null && daysLeftInQuarter < 14;

  const totalSlots = Math.max(passport.streak + 3, 4);

  return (
    <div>
      <div className="border-b-[0.5px] border-[#E5E5EA] bg-white px-3.5 py-2.5 lg:px-6 lg:py-5">
        <h1 className="text-[13px] font-extrabold tracking-[-0.4px] text-ink lg:text-[16px]">
          Donation Passport
        </h1>
        <p className="text-[8px] text-ink-muted lg:text-[11px]">Your verified blood donor identity</p>
      </div>

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

      <div className="mt-3">
        <PassportTiers currentTier={passport.tier} />
      </div>

      <div className="mx-2.5 mt-3 flex gap-1.5 lg:mx-6 lg:gap-2.5">
        <Link
          href="/passport/log"
          className="flex-1 rounded-full bg-red py-2.5 text-center text-[10px] font-bold text-white lg:py-3 lg:text-[13px]"
        >
          Log donation
        </Link>
        <Link
          href="/passport/share"
          className="flex-1 rounded-full bg-surface py-2.5 text-center text-[10px] font-semibold text-ink lg:py-3 lg:text-[13px]"
        >
          Share passport
        </Link>
      </div>

      <DonationHistory donations={donations} totalCount={donations.length} limit={3} />

      {passport.donationCount >= 1 && (
        <div className="mx-2.5 mt-4 lg:mx-6">
          <div className="rounded-2xl bg-white p-3.5 lg:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-ink lg:text-[14px]">Donation streak</p>
                <p className="text-[10px] text-ink-muted lg:text-[12px]">
                  {passport.streak}-quarter streak
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <Flame className="size-5 text-red lg:size-6" />
                <span className="text-2xl font-extrabold text-red lg:text-3xl">{passport.streak}</span>
              </div>
            </div>

            <div className="mt-2.5 flex gap-1.5 lg:gap-2">
              {Array.from({ length: totalSlots }).map((_, i) => {
                const isPast = i < passport.streak;
                const isCurrent = i === passport.streak;
                return (
                  <span
                    key={i}
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full border text-[10px] lg:size-8 lg:text-[12px]",
                      isPast && "border-red bg-red text-white",
                      isCurrent && "border-dashed border-red-mid text-red",
                      !isPast && !isCurrent && "border-[#E5E5EA] bg-surface",
                    )}
                  >
                    {isPast ? "✓" : isCurrent ? "…" : ""}
                  </span>
                );
              })}
            </div>

            {streakAtRisk && (
              <div className="mt-2 rounded-xl bg-red-light px-2.5 py-[7px] lg:px-3.5 lg:py-2.5">
                <p className="text-[9px] font-bold text-red lg:text-[11px]">
                  Donate in {daysLeftInQuarter} day{daysLeftInQuarter === 1 ? "" : "s"} to keep
                  your {passport.streak}-quarter streak
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="h-4" />
    </div>
  );
}
