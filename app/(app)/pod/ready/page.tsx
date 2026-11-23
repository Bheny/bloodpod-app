import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getReadinessOverview } from "@/lib/readiness/view";
import { READINESS } from "@/lib/readiness-config";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { ReadinessCard } from "@/components/readiness/ReadinessCard";
import { SpinoffForm } from "@/components/readiness/ReadinessActions";

export const dynamic = "force-dynamic";

export default async function PodReadinessPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardingComplete) redirect("/onboarding");

  const { pods, offers } = await getReadinessOverview(user.id);
  const spinnable = offers.filter((o) => o.canStart);
  const almost = offers.filter((o) => !o.canStart);

  return (
    <div>
      <AppHeader wide backHref="/pod" title="Pod readiness" subtitle="Check that your Pod would answer when it counts" />

      <div className="flex max-w-2xl flex-col gap-3.5 px-3.5 pb-28 pt-4 lg:px-0 lg:pb-8 lg:pt-0">
        {pods.length > 0 ? (
          pods.map((p) => (
            <div key={p.podId} className="flex flex-col gap-1.5">
              <h2 className="px-1 text-body-sm font-bold text-ink">{p.podName}</h2>
              <ReadinessCard podId={p.podId} readiness={p} headingLevel="h3" />
            </div>
          ))
        ) : (
          <Card>
            <CardTitle>Lead a Pod first</CardTitle>
            <p className="mt-2 text-body-sm text-ink-mid">
              Every donor can lead a Pod. Start one, invite people you trust, and this page shows whether it is ready.
            </p>
            <Link href="/pod" className="mt-4 flex min-h-11 items-center justify-center rounded-full bg-red px-5 text-body-sm font-bold text-white">
              Go to your Pods
            </Link>
          </Card>
        )}

        {(spinnable.length > 0 || almost.length > 0) && (
          <section id="spinoff" aria-label="Start a Pod from your invites" className="flex flex-col gap-3.5">
            {spinnable.map((o) => (
              <Card key={o.podId}>
                <CardTitle>Start a Pod from your invites</CardTitle>
                <p className="mb-3 mt-1 text-caption text-ink-muted">
                  {o.invitees.length} people you brought into {o.podName} have joined. You can lead a Pod of your own with them.
                </p>
                <SpinoffForm podId={o.podId} podName={o.podName} count={o.invitees.length} />
              </Card>
            ))}
            {almost.map((o) => (
              <Card key={o.podId}>
                <CardTitle>{o.podName}</CardTitle>
                <p className="mt-1 text-caption text-ink-muted">
                  {o.invitees.length} of {READINESS.spinoffMinInvitees} people you invited have joined and finished their profile. At {READINESS.spinoffMinInvitees}, you can start a Pod of your own.
                </p>
              </Card>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
