import { Badge, EmptyState, Panel } from "@/components/admin/ui";
import { longDate } from "@/lib/admin/format";
import type { getDonorPods } from "@/lib/admin/pod-strength";

type Garden = Awaited<ReturnType<typeof getDonorPods>>;

const TONE = { Thriving: "green", "Needs water": "amber", Wilting: "red" } as const;
const BAR = { Thriving: "bg-[#1FA855]", "Needs water": "bg-[#F59E0B]", Wilting: "bg-red" } as const;

/** How strong each Pod this donor leads is, on the donor's admin page. Counts only, no names of members. */
export function PodStrengthPanel({ garden }: { garden: Garden }) {
  if (!garden) {
    return (
      <Panel title="Pod strength">
        <EmptyState title="Could not read Pod strength" body="Try again in a moment." />
      </Panel>
    );
  }
  return (
    <Panel
      title="Pod strength"
      subtitle={`Garden: ${garden.stage} · ${garden.uniqueReady} ready ${garden.uniqueReady === 1 ? "person" : "people"}, counted once each`}
    >
      <p className="text-caption text-ink-muted">
        {garden.title ? `Gardener title: ${garden.title}. ` : "No gardener title yet. "}
        {garden.weeks} tended {garden.weeks === 1 ? "week" : "weeks"}
        {garden.tendedThisWeek ? ", including this one." : ", none yet this week."}
      </p>

      <ul className="mt-4 space-y-3">
        {garden.plots.map((p) => (
          <li key={p.podId} className="rounded-2xl bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-body-sm font-bold text-ink">{p.name}</p>
                <p className="text-caption text-ink-muted">
                  {p.ready} ready of {p.total} {p.total === 1 ? "person" : "people"} · a drill needs {p.needed}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[24px] font-extrabold leading-none tracking-[-0.8px] text-ink">{p.score}</p>
                <div className="mt-1.5">
                  <Badge tone={TONE[p.label]}>{p.label}</Badge>
                </div>
              </div>
            </div>

            <div
              className="mt-3 h-2 overflow-hidden rounded-full bg-card"
              role="progressbar"
              aria-label={`${p.name} strength`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={p.score}
            >
              <div className={`h-full rounded-full ${BAR[p.label]}`} style={{ width: `${p.score}%` }} />
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-caption">
              <dt className="text-ink-muted">Last drill</dt>
              <dd className="text-right font-semibold text-ink">
                {p.lastDrill ? `${longDate(p.lastDrill.startedAt)} · ${!p.lastDrill.closed ? "running" : p.lastDrill.passed ? "passed" : "not passed"}` : "Never"}
              </dd>
              <dt className="text-ink-muted">Not ready</dt>
              <dd className="text-right font-semibold text-ink">{p.notReady}</dd>
              <dt className="text-ink-muted">Counted once</dt>
              <dd className="text-right font-semibold text-ink">{p.duplicates.length}</dd>
            </dl>

            {p.nudge && <p className="mt-3 text-caption text-ink-mid">{p.nudge}</p>}
          </li>
        ))}
      </ul>
    </Panel>
  );
}
