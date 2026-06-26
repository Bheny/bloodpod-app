import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPassportData } from "@/lib/passport-data";
import { AppHeader } from "@/components/layout/AppHeader";
import { DonationHistory } from "@/components/passport/DonationHistory";

export default async function DonationHistoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardingComplete) redirect("/onboarding");

  const data = await getPassportData(user.id);
  if (!data) redirect("/sign-in");

  return (
    <div>
      <AppHeader title="Donation history" subtitle="All logged donations" backHref="/passport" />
      <div className="py-3">
        <DonationHistory
          donations={data.donations}
          totalCount={data.donations.length}
          showSeeAll={false}
        />
      </div>
    </div>
  );
}
