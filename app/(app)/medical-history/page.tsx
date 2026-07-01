import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { AppHeader } from "@/components/layout/AppHeader";
import { MedicalHistoryForm } from "@/components/profile/MedicalHistoryForm";

export default async function MedicalHistoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardingComplete) redirect("/onboarding");

  return (
    <div>
      <AppHeader
        title="Medical history"
        subtitle="Kept private — visible only to you"
        backHref="/profile"
      />

      <div className="px-4 pt-4">
        <Link
          href="/passport/history"
          className="flex items-center justify-between rounded-2xl border-[0.5px] border-[#E5E5EA] bg-white px-3.5 py-3"
        >
          <span className="text-[12px] font-bold text-ink">View donation history</span>
        </Link>
      </div>

      <MedicalHistoryForm
        defaultValues={{
          genotype: user.genotype ?? "",
          allergies: user.allergies ?? "",
          chronicConditions: user.chronicConditions ?? "",
          medications: user.medications ?? "",
          emergencyContactName: user.emergencyContactName ?? "",
          emergencyContactPhone: user.emergencyContactPhone ?? "",
        }}
      />
    </div>
  );
}
