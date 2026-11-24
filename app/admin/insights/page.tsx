import { requireAdmin } from "@/lib/admin/auth";
import { duration, getInsights, INSIGHT_WINDOWS, MIN_GROUP, type InsightWindow } from "@/lib/admin/insights";
import { EmptyState, FilterTabs, HBars, PageTitle, Panel, StatCard, StatGrid } from "@/components/admin/ui";
import { PairedBars } from "@/components/admin/charts";

const WINDOW_LABEL: Record<InsightWindow, string> = { 30: "30 days", 90: "90 days", 365: "12 months" };

export default async function AdminInsightsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  await requireAdmin();
  const { days: raw } = await searchParams;
  const days = (INSIGHT_WINDOWS.find((d) => String(d) === raw) ?? 90) as InsightWindow;
  const i = await getInsights(days);
  const { totals: t } = i;

  const gaps = i.types.filter((x) => x.ready === 0);
  const thin = i.types.filter((x) => x.ready > 0 && x.ready < MIN_GROUP);

  return (
    <div>
      <PageTitle
        title="Insights"
        subtitle="Supply and response: who could give blood, and how fast the network answers. Counts only, never names."
      />

      <div className="mb-5">
        <FilterTabs
          active={String(days)}
          items={INSIGHT_WINDOWS.map((d) => ({ id: String(d), label: `Last ${WINDOW_LABEL[d]}`, href: `/admin/insights?days=${d}` }))}
        />
      </div>

      <StatGrid cols={4}>
        <StatCard label="Ready to give" value={t.ready} hint={`of ${t.registered} registered donors`} />
        <StatCard label="Alerts sent" value={t.alerts} hint={`last ${WINDOW_LABEL[days]}, real requests only`} />
        <StatCard
          label="Got a yes"
          value={t.alerts ? `${t.answerRate}%` : "none yet"}
          tone={t.alerts > 0 && t.answerRate < 50 ? "warn" : "default"}
          hint={t.alerts ? `${t.answered} of ${t.alerts} alerts` : "no alerts in this period"}
        />
        <StatCard label="Median time to first yes" value={duration(t.medianSeconds)} hint="from the alert to the first person coming" />
      </StatGrid>

      {(gaps.length > 0 || thin.length > 0) && t.registered > 0 && (
        <div className="mt-4 rounded-2xl border border-red-mid bg-red-light/50 p-4 text-body-sm text-ink">
          {gaps.length > 0 && (
            <p>
              <span className="font-bold">No one ready for:</span> {gaps.map((g) => g.label).join(", ")}.
            </p>
          )}
          {thin.length > 0 && (
            <p className={gaps.length > 0 ? "mt-1" : ""}>
              <span className="font-bold">Fewer than {MIN_GROUP} ready for:</span> {thin.map((g) => g.label).join(", ")}.
            </p>
          )}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <Panel title="Supply by blood type" subtitle="Registered donors, and how many are ready to give today.">
          {t.registered === 0 ? (
            <EmptyState title="No donors with a blood type yet" />
          ) : (
            <HBars
              color="#1FA855"
              rows={i.types.map((x) => ({ label: x.label, value: x.ready, sub: `of ${x.registered}` }))}
            />
          )}
        </Panel>

        <Panel title="Asked for, and answered" subtitle="Real requests by blood type, and how many got a yes.">
          {t.alerts === 0 ? (
            <EmptyState title="No alerts in this period" body="Once people send requests, demand by blood type shows here." />
          ) : (
            <HBars
              color="#DD0000"
              rows={i.types
                .filter((x) => x.requested > 0)
                .sort((a, b) => b.requested - a.requested)
                .map((x) => ({ label: x.label, value: x.requested, sub: `${x.answered} answered` }))}
            />
          )}
        </Panel>
      </div>

      <div className="mt-6">
        <Panel
          title="Ready donors by city and blood type"
          subtitle={`Ready to give today. A number under ${MIN_GROUP} is hidden as "<${MIN_GROUP}" so no one can be picked out; 0 means none.`}
        >
          {i.cities.length === 0 ? (
            <EmptyState title="No cities yet" />
          ) : (
            <div className="-mx-1 overflow-x-auto px-1">
              <table className="w-full min-w-[640px] text-left text-caption">
                <thead>
                  <tr className="text-ink-muted">
                    <th className="py-2 pr-3 font-semibold">City</th>
                    <th className="px-2 py-2 text-right font-semibold">Ready</th>
                    {i.types.map((x) => (
                      <th key={x.type} className="px-2 py-2 text-right font-semibold">
                        {x.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y-[0.5px] divide-hairline">
                  {i.cities.map((c) => (
                    <tr key={c.city}>
                      <td className="py-2 pr-3 font-semibold text-ink">{c.city}</td>
                      <td className="px-2 py-2 text-right font-bold tabular-nums text-ink">{c.ready >= MIN_GROUP || c.ready === 0 ? c.ready : `<${MIN_GROUP}`}</td>
                      {i.types.map((x) => {
                        const v = c.byType[x.type];
                        return (
                          <td
                            key={x.type}
                            className={`px-2 py-2 text-right tabular-nums ${v === 0 ? "font-bold text-red-fg" : v === null ? "text-ink-faint" : "text-ink-mid"}`}
                          >
                            {v === null ? `<${MIN_GROUP}` : v}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr] lg:gap-6">
        <Panel title="Alerts and answers by week" subtitle="Real requests sent, and how many got at least one yes.">
          {i.weekly.length < 2 ? (
            <EmptyState title="Not enough data yet" body="Needs alerts in at least two weeks." />
          ) : (
            <PairedBars data={i.weekly} aLabel="Alerts" bLabel="Got a yes" aColor="#DD0000" bColor="#1FA855" />
          )}
        </Panel>

        <Panel title="Response by urgency" subtitle="How quickly the first person said they were coming.">
          {t.alerts === 0 ? (
            <EmptyState title="No alerts in this period" />
          ) : (
            <ul className="divide-y-[0.5px] divide-hairline">
              {i.byUrgency.map((r) => (
                <li key={r.label} className="flex items-center justify-between gap-3 py-2.5">
                  <span>
                    <span className="block text-body-sm font-semibold text-ink">{r.label}</span>
                    <span className="block text-caption text-ink-muted">
                      {r.answered} of {r.alerts} got a yes
                    </span>
                  </span>
                  <span className="shrink-0 text-body-sm font-extrabold tabular-nums text-ink">{duration(r.medianSeconds)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Practice drills" subtitle="How fast Pods answer when nobody is in need. A drill is a practice alert, not a real request.">
          {i.drills.runs === 0 ? (
            <EmptyState title="No drills in this period" body="Pods with five ready people can run one from the Pod readiness page." />
          ) : (
            <StatGrid cols={3}>
              <StatCard label="Drills finished" value={i.drills.runs} />
              <StatCard label="Passed" value={`${i.drills.passRate}%`} hint="enough people answered in time" />
              <StatCard label="Median answer time" value={duration(i.drills.medianSeconds)} hint={`${i.drills.responses} answers`} />
            </StatGrid>
          )}
        </Panel>
      </div>

      <p className="mt-6 text-caption text-ink-muted">
        Counts cover donors who finished joining, not hospital or lab staff, and leave out test alerts. “Ready” means eligible to give
        now. Time to first yes is measured from the alert being sent. Nothing on this page names a person.
      </p>
    </div>
  );
}
