import Link from "next/link";
import { redirect } from "next/navigation";
import { IdCard } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { userCan } from "@/lib/plan-access";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/Button";
import { MedicalIdCard } from "@/components/medical-id/MedicalIdCard";

export const dynamic = "force-dynamic";

/**
 * Your Medical ID. A tool, so it needs a plan that includes it: read from the database on every load.
 * The data is yours alone: it is read for you and never shown to a Pod, a hospital or another person.
 */
export default async function MedicalIdPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user.hospitalId) redirect("/hospital");
  if (user.labId) redirect("/lab");
  if (!user.onboardingComplete) redirect("/onboarding");

  const allowed = await userCan(user.id, "medical_id");

  return (
    <div>
      <AppHeader title="Medical ID" subtitle="Your blood group and emergency details, ready for a lock screen" backHref="/profile" />

      <div className="px-3.5 pb-8 pt-4 lg:max-w-xl lg:px-0 lg:pt-0">
        {allowed ? (
          <MedicalIdCard
            source={{
              name: user.name,
              bloodType: user.bloodType,
              genotype: user.genotype,
              allergies: user.allergies,
              chronicConditions: user.chronicConditions,
              medications: user.medications,
              emergencyContactName: user.emergencyContactName,
              emergencyContactPhone: user.emergencyContactPhone,
            }}
          />
        ) : (
          <section className="flex flex-col items-center gap-3 rounded-3xl border-[0.5px] border-hairline bg-card px-6 py-10 text-center shadow-raised lg:rounded-2xl">
            <IdCard className="size-9 text-red" aria-hidden />
            <p className="text-title font-extrabold text-ink">Medical ID is part of Basic, Plus and Care Pod</p>
            <p className="max-w-xs text-body-sm text-ink-muted">
              It turns your blood group, allergies and emergency contact into an image you can set as your lock screen, so a stranger can help you without unlocking your phone.
            </p>
            <p className="max-w-xs text-caption text-ink-muted">Alerts, your Blood Card and joining Pods stay free for everyone.</p>
            <Button asChild className="mt-1">
              <Link href="/upgrade">See plans</Link>
            </Button>
          </section>
        )}
      </div>
    </div>
  );
}
