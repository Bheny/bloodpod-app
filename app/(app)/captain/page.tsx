import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isCaptainEnabled } from "@/lib/captain/flag";
import { getCaptainOverview } from "@/lib/captain/view";
import { CAPTAIN } from "@/lib/captain-config";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { CaptainBadge } from "@/components/captain/CaptainBadge";
import { StarterCard } from "@/components/captain/StarterCard";
import { Lineage } from "@/components/captain/Lineage";
import { PledgeCard, SpinoffForm } from "@/components/captain/CaptainActions";

export const dynamic = "force-dynamic";

export default async function CaptainPage() {
  if (!(await isCaptainEnabled())) notFound();
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardingComplete) redirect("/onboarding");

  const view = await getCaptainOverview(user.id);
  const lead = view.progress[0];
  const others = view.progress.slice(1);
  const spinnable = view.offers.filter((o) => o.canStart);
  const almost = view.offers.filter((o) => !o.canStart);

  return (
    <div>
      <AppHeader
        wide
        backHref="/pod"
        title="Captain"
        subtitle="Grow a network that answers when it counts"
        actions={view.badge ? <CaptainBadge title={view.badge.title} size="md" /> : undefined}
      />

      <div className="flex max-w-2xl flex-col gap-3.5 px-3.5 pb-28 pt-4 lg:px-0 lg:pb-8 lg:pt-0">
        {view.awaitingPledge && (
          <Card>
            <PledgeCard />
          </Card>
        )}

        {view.lapse && view.lapse.stage !== "ok" && (
          <Card className="bg-red-light">
            <p className="text-body-sm font-bold text-ink">Your badge needs a little attention</p>
            <p className="mt-1 text-caption text-ink-mid">
              You keep it for {view.lapse.daysLeft} more {view.lapse.daysLeft === 1 ? "day" : "days"} while you put things right. The steps below show what is missing.
            </p>
          </Card>
        )}

        {lead ? (
          <>
            <StarterCard podId={lead.podId} result={lead.result} />

            <Card>
              <CardTitle>{lead.podName}</CardTitle>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl bg-surface px-2 py-3">
                  <dt className="text-caption text-ink-muted">Pods grown</dt>
                  <dd className="text-title font-extrabold text-ink">{lead.grownCount}</dd>
                </div>
                <div className="rounded-2xl bg-surface px-2 py-3">
                  <dt className="text-caption text-ink-muted">Working</dt>
                  <dd className="text-title font-extrabold text-ink">{lead.result.qualifyingChildren}</dd>
                </div>
                <div className="rounded-2xl bg-surface px-2 py-3">
                  <dt className="text-caption text-ink-muted">People</dt>
                  <dd className="text-title font-extrabold text-ink">{lead.uniqueDonors}</dd>
                </div>
              </dl>

              {lead.lastDrill && (
                <Link
                  href={`/captain/drill/${lead.lastDrill.id}`}
                  className="mt-3 flex min-h-11 items-center justify-between rounded-2xl bg-surface px-4 text-body-sm text-ink"
                >
                  <span className="font-semibold">Last drill</span>
                  <span className="text-ink-muted">
                    {lead.lastDrill.closedAt ? (lead.lastDrill.passed ? "Passed" : "Not yet") : "Running now"}
                  </span>
                </Link>
              )}
            </Card>

            <Card>
              <CardTitle>Pods grown from yours</CardTitle>
              {lead.lineage.length === 0 ? (
                <p className="mt-2 text-caption text-ink-muted">
                  Nothing yet. When someone you invited starts a Pod from their own invites, it shows up here.
                </p>
              ) : (
                <div className="mt-2">
                  <Lineage nodes={lead.lineage} />
                </div>
              )}
            </Card>

            {others.map((p) => (
              <StarterCard key={p.podId} podId={p.podId} result={p.result} headingLevel="h3" />
            ))}
          </>
        ) : (
          <Card>
            <CardTitle>Lead a Pod first</CardTitle>
            <p className="mt-2 text-body-sm text-ink-mid">
              Anyone can lead a Pod. Start one, invite people you trust, and this page shows how it is growing.
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
                  {o.invitees.length} of {CAPTAIN.spinoffMinInvitees} people you invited have joined and finished their profile. At {CAPTAIN.spinoffMinInvitees}, you can start a Pod of your own.
                </p>
              </Card>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
