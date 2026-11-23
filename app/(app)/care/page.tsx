import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, HeartHandshake } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getMyCareProfiles, userCan } from "@/lib/care";
import { BLOOD_TYPE_LABELS } from "@/lib/blood-type";
import { formatDate } from "@/lib/formatters";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/Button";

export default async function CarePodsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user.hospitalId) redirect("/hospital");
  if (user.labId) redirect("/lab");
  if (!user.onboardingComplete) redirect("/onboarding");

  const [profiles, active] = await Promise.all([getMyCareProfiles(user.id), userCan(user.id, "care_dashboard")]);

  return (
    <div>
      <AppHeader title="Care Pods" subtitle="Plan ahead for people who need blood again and again" />

      <div className="flex flex-col gap-3 px-3.5 pb-8 pt-4 lg:max-w-xl lg:px-0 lg:pt-0">
        {profiles.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-3xl border-[0.5px] border-hairline bg-card px-6 py-10 text-center shadow-raised lg:rounded-2xl">
            <HeartHandshake className="size-9 text-red" aria-hidden />
            <p className="text-title font-extrabold text-ink">No Care Pods yet</p>
            <p className="max-w-xs text-body-sm text-ink-muted">
              Line up the people who give for each transfusion date, so the next one is never a scramble.
            </p>
            <Button asChild className="mt-1">
              <Link href={active ? "/care/new" : "/upgrade"}>{active ? "Set up a Care Pod" : "See plans"}</Link>
            </Button>
          </div>
        ) : (
          <>
            {profiles.map((p) => (
              <Link
                key={p.id}
                href={`/care/${p.id}`}
                className="flex min-h-16 items-center gap-3 rounded-3xl border-[0.5px] border-hairline bg-card p-4 shadow-raised transition-transform active:scale-[0.99] lg:rounded-2xl"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-red-light text-body-sm font-extrabold text-red-fg">{BLOOD_TYPE_LABELS[p.bloodType]}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body-sm font-bold text-ink">{p.displayName}</span>
                  <span className="block text-caption text-ink-muted">{p.nextTransfusionAt ? `Next: ${formatDate(p.nextTransfusionAt)}` : "No date planned"}</span>
                </span>
                <ChevronRight className="size-4 text-ink-faint" aria-hidden />
              </Link>
            ))}
            {active && (
              <Button asChild variant="secondary">
                <Link href="/care/new">Add another Care Pod</Link>
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
