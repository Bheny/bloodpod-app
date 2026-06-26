import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { AppHeader } from "@/components/layout/AppHeader";
import { LogDonationForm } from "@/components/passport/LogDonationForm";

export default async function LogDonationPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardingComplete) redirect("/onboarding");

  return (
    <div>
      <AppHeader
        title="Log a donation"
        subtitle="Update your passport and streak"
        backHref="/passport"
      />
      <LogDonationForm defaultBloodType={user.bloodType} />
    </div>
  );
}
