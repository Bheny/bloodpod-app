import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CalendarDays, Phone, Users } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getCareDashboard, userCan } from "@/lib/care";
import { CONDITION_LABELS, daysUntilDate, rotaState, canSeeCondition } from "@/lib/care-rules";
import { BLOOD_TYPE_LABELS } from "@/lib/blood-type";
import { formatDate } from "@/lib/formatters";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { AddDate, AskDonors, MarkDone } from "@/components/care/CareActions";

const STATE_COPY = {
  full: { text: "Rota is full", tone: "bg-success-soft text-success-strong" },
  short: { text: "Rota is short", tone: "bg-red-light text-red-fg" },
  empty: { text: "No one confirmed yet", tone: "bg-red-light text-red-fg" },
} as const;

export default async function CareDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardingComplete) redirect("/onboarding");

  const data = await getCareDashboard(user.id, id);
  if (!data) notFound();
  const { profile, dates, next, pod, donors } = data;

  // Read from the database on every load. A lapsed plan keeps the history but pauses the tools.
  const active = await userCan(user.id, "care_dashboard");
  const showCondition = canSeeCondition(user.id, profile);
  const history = dates.filter((d) => d.completedAt).reverse();
  const upcoming = dates.filter((d) => !d.completedAt && d.id !== next?.id);

  const left = next ? daysUntilDate(next.scheduledFor) : null;
  const state = next ? rotaState(next.counts.yes, next.donorsNeeded) : null;

  return (
    <div>
      <AppHeader
        title={profile.displayName}
        subtitle={`${BLOOD_TYPE_LABELS[profile.bloodType]}${showCondition ? ` · ${CONDITION_LABELS[profile.conditionType]}` : ""}${profile.hospitalName ? ` · ${profile.hospitalName}` : ""}`}
        backHref="/care"
      />

      <div className="flex flex-col gap-3.5 px-3.5 pb-8 pt-4 lg:max-w-xl lg:px-0 lg:pt-0">
        {!active && (
          <div className="rounded-3xl bg-red-light p-4 text-body-sm text-red-fg lg:rounded-2xl">
            <p className="font-bold">Your Care Pod subscription has ended.</p>
            <p className="mt-1">Your history stays here. Asking donors and reminders are paused.</p>
            <Link href="/upgrade" className="mt-2 inline-block font-bold underline underline-offset-2">
              See plans
            </Link>
          </div>
        )}

        <Card>
          <CardTitle aside={state && <span className={`rounded-full px-3 py-1 text-label font-bold ${STATE_COPY[state].tone}`}>{STATE_COPY[state].text}</span>}>Next transfusion</CardTitle>
          {next && left !== null ? (
            <>
              <p className="mt-3 text-[32px] font-extrabold leading-none tracking-[-1px] text-ink">{formatDate(next.scheduledFor)}</p>
              <p className="mt-1 text-body-sm text-ink-muted">
                {left <= 0 ? "Today" : left === 1 ? "Tomorrow" : `In ${left} days`} · {next.counts.yes} of {next.donorsNeeded} donors confirmed
              </p>

              {next.confirmed.length > 0 && (
                <ul className="mt-4 flex flex-col divide-y-[0.5px] divide-hairline rounded-2xl bg-surface px-3.5">
                  {next.confirmed.map((p) => (
                    <li key={p.entryId} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-body-sm font-bold text-ink">{p.name ?? "Donor"}</p>
                        <p className="text-caption text-ink-muted">{p.bloodType ? BLOOD_TYPE_LABELS[p.bloodType] : ""} · said Yes</p>
                      </div>
                      {p.phone && (
                        <a href={`tel:${p.phone}`} aria-label={`Call ${p.name ?? "donor"}`} className="flex size-11 shrink-0 items-center justify-center rounded-full bg-card shadow-raised">
                          <Phone className="size-4 text-ink" />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {next.counts.waiting > 0 && <p className="mt-3 text-caption text-ink-muted">{next.counts.waiting} asked, waiting to hear back.</p>}

              <div className="mt-4">
                <MarkDone profileId={profile.id} dateId={next.id} disabled={!active} />
              </div>
            </>
          ) : (
            <p className="mt-3 text-body-sm text-ink-muted">No date is planned. Add the next transfusion below.</p>
          )}
        </Card>

        {next && (
          <Card>
            <CardTitle aside={<Users className="size-4 text-ink-faint" aria-hidden />}>Who can give</CardTitle>
            <p className="mb-3 mt-1 text-caption text-ink-muted">
              {pod ? `People in ${pod.name} whose blood suits ${profile.displayName} and who can give by that date.` : "Link a Pod to see who can give."}
            </p>
            {pod ? (
              <AskDonors
                profileId={profile.id}
                dateId={next.id}
                disabled={!active}
                donors={donors.map((d) => ({ ...d, asked: next.askedIds.includes(d.userId) }))}
              />
            ) : (
              <Link href="/pod" className="text-body-sm font-bold text-red-fg underline underline-offset-2">
                Go to your Pods
              </Link>
            )}
          </Card>
        )}

        <Card>
          <CardTitle aside={<CalendarDays className="size-4 text-ink-faint" aria-hidden />}>Dates</CardTitle>
          {upcoming.length > 0 && (
            <ul className="mb-4 mt-2 flex flex-col divide-y-[0.5px] divide-hairline">
              {upcoming.map((d) => (
                <li key={d.id} className="flex items-center justify-between py-2.5 text-body-sm">
                  <span className="font-bold text-ink">{formatDate(d.scheduledFor)}</span>
                  <span className="text-ink-muted">{d.counts.yes} of {d.donorsNeeded} confirmed</span>
                </li>
              ))}
            </ul>
          )}
          <div className={upcoming.length ? "" : "mt-3"}>
            <AddDate profileId={profile.id} disabled={!active} />
          </div>
        </Card>

        <Card>
          <CardTitle>History</CardTitle>
          {history.length ? (
            <ul className="mt-2 flex flex-col divide-y-[0.5px] divide-hairline">
              {history.map((d) => (
                <li key={d.id} className="flex items-center justify-between py-2.5 text-body-sm">
                  <span className="font-bold text-ink">{formatDate(d.scheduledFor)}</span>
                  <span className="text-ink-muted">{d.counts.yes} donors</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-body-sm text-ink-muted">Completed transfusions will be listed here.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
