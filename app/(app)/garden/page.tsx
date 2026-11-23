import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getGarden, type PlotView } from "@/lib/garden-data";
import { STAGES, TITLES, type PlotLabel } from "@/lib/garden";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { CheckIn } from "@/components/garden/CheckIn";
import { VisibilityToggle } from "@/components/garden/VisibilityToggle";

export const dynamic = "force-dynamic";

const labelTone: Record<PlotLabel, string> = {
  Thriving: "text-success-strong",
  "Needs water": "text-ink-mid",
  Wilting: "text-red-fg",
};

function Plot({ plot }: { plot: PlotView }) {
  const same = plot.duplicates.length;
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle>{plot.name}</CardTitle>
          <p className="mt-0.5 text-caption text-ink-muted">
            {plot.ready} ready of {plot.total} {plot.total === 1 ? "person" : "people"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[28px] font-extrabold leading-none tracking-[-1px] text-ink">{plot.score}</p>
          <p className={`mt-1 text-label font-bold uppercase tracking-wide ${labelTone[plot.label]}`}>{plot.label}</p>
        </div>
      </div>

      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-surface"
        role="progressbar"
        aria-label={`${plot.name} health`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={plot.score}
      >
        <div className="h-full rounded-full bg-success-strong" style={{ width: `${plot.score}%` }} />
      </div>

      {plot.nudge && <p className="mt-3 text-body-sm text-ink">{plot.nudge}</p>}

      {same > 0 && (
        <p className="mt-2 rounded-xl bg-surface px-3 py-2 text-caption text-ink-mid">
          {same === 1 ? "1 person is" : `${same} people are`} counted once:{" "}
          {plot.duplicates.map((d) => `${d.name} ${d.reason === "same_phone" ? "shares a phone number with" : "is the same account as"} ${d.sameAs}`).join("; ")}.
        </p>
      )}
      {plot.notReady > 0 && (
        <p className="mt-2 text-caption text-ink-muted">
          {plot.notReady} {plot.notReady === 1 ? "person has" : "people have"} not finished setting up their profile yet, or cannot give right now.
        </p>
      )}

      <Link href="/pod/ready" className="mt-3 inline-flex min-h-11 items-center text-body-sm font-bold text-red-fg underline underline-offset-2">
        Run a drill for this Pod
      </Link>
    </Card>
  );
}

export default async function GardenPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user.hospitalId) redirect("/hospital");
  if (user.labId) redirect("/lab");
  if (!user.onboardingComplete) redirect("/onboarding");

  const g = await getGarden(user.id);
  const title = g.title.title;

  return (
    <div>
      <AppHeader wide backHref="/profile" title="Your Garden" subtitle="The people you can count on, and how well you tend them" />

      <div className="flex max-w-2xl flex-col gap-3.5 px-3.5 pb-28 pt-4 lg:px-0 lg:pb-8 lg:pt-0">
        <Card>
          <p className="text-label font-bold uppercase tracking-wide text-red-fg">Your Garden</p>
          <h2 className="mt-1 text-[28px] font-extrabold leading-tight tracking-[-0.8px] text-ink">{g.stage.name}</h2>
          <p className="mt-1 text-caption text-ink-muted">
            {g.uniqueReady} {g.uniqueReady === 1 ? "person" : "people"} ready across {g.plots.length} {g.plots.length === 1 ? "plot" : "plots"}, counted once each.
          </p>

          <ol className="mt-3 grid grid-cols-4 gap-1.5" aria-label="Garden stages">
            {STAGES.slice(1).map((s) => (
              <li key={s.id} className="text-center">
                <div className={`h-2 rounded-full ${g.stage.stage >= s.id ? "bg-success-strong" : "bg-surface"}`} />
                <p className={`mt-1 text-label font-bold ${g.stage.stage >= s.id ? "text-ink" : "text-ink-faint"}`}>{s.name}</p>
              </li>
            ))}
          </ol>

          {g.stage.next && <p className="mt-3 text-body-sm text-ink">{g.stage.next.line}</p>}
          <p className="mt-2 text-caption text-ink-muted">
            Your plots and the people in them are private. BloodPod may show your first name, title and stage when it celebrates Garden leaders; you can opt out below. None of this changes who is alerted, in what order, or whether anyone can join a Pod.
          </p>
        </Card>

        <Card>
          <p className="text-label font-bold uppercase tracking-wide text-red-fg">You, the gardener</p>
          <h2 className="mt-1 text-title font-extrabold leading-tight tracking-[-0.4px] text-ink">{title ? title.name : "Not started yet"}</h2>
          <p className="mt-1 text-caption text-ink-muted">
            {g.weeks} tended {g.weeks === 1 ? "week" : "weeks"}. A title stays with you, even if a Pod goes quiet.
          </p>
          {g.title.next && <p className="mt-3 text-body-sm text-ink">{g.title.next.line}</p>}

          <ol className="mt-3 flex flex-wrap gap-1.5" aria-label="Gardener titles">
            {TITLES.map((t) => (
              <li
                key={t.id}
                className={`rounded-full px-3 py-1 text-label font-bold ${title && title.id >= t.id ? "bg-success-soft text-success-strong" : "bg-surface text-ink-faint"}`}
              >
                {t.name}
              </li>
            ))}
          </ol>

          {g.plots.length > 0 && (
            <div className="mt-4">
              <CheckIn done={g.tendedThisWeek} />
            </div>
          )}
        </Card>

        {g.plots.length > 0 ? (
          <>
            <h2 className="px-1 pt-1 text-body-sm font-bold text-ink">Your plots</h2>
            {g.plots.map((p) => (
              <Plot key={p.podId} plot={p} />
            ))}
          </>
        ) : (
          <Card>
            <CardTitle>Bare ground</CardTitle>
            <p className="mt-2 text-body-sm text-ink-mid">
              Every Pod you lead is a plot in your Garden. Start one, invite people you trust, and this page shows how it grows.
            </p>
            <Link href="/pod" className="mt-4 flex min-h-11 items-center justify-center rounded-full bg-red px-5 text-body-sm font-bold text-white">
              Go to your Pods
            </Link>
          </Card>
        )}

        {g.plots.length > 0 && (
          <Card>
            <VisibilityToggle initialHidden={g.hidden} />
          </Card>
        )}
      </div>
    </div>
  );
}
