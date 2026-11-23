import { requireAdmin } from "@/lib/admin/auth";
import { getEmergencies } from "@/lib/admin/metrics";
import { longDate } from "@/lib/admin/format";
import { BLOOD_TYPE_LABELS } from "@/lib/blood-type";
import { Badge, EmptyState, HBars, PageTitle, Panel, StatCard, StatGrid } from "@/components/admin/ui";
import { Card } from "@/components/ui/Card";

const STATUS_TONE = { OPEN: "red", MATCHED: "blue", FULFILLED: "green", CANCELLED: "gray", EXPIRED: "amber" } as const;

const span = (s: number | null) => (s === null ? "none yet" : s < 90 ? `${s}s` : s < 5400 ? `${Math.round(s / 60)} min` : `${Math.round(s / 3600)} h`);
const URGENCY_TONE = { CRITICAL: "red", URGENT: "amber", STANDARD: "gray" } as const;

export default async function AdminEmergenciesPage() {
  await requireAdmin();
  const e = await getEmergencies();

  return (
    <div>
      <PageTitle title="Emergencies" subtitle="Blood requests raised in the app." />

      <StatGrid cols={4}>
        <StatCard label="Open now" value={e.status.OPEN} tone={e.status.OPEN > 0 ? "warn" : "default"} />
        <StatCard label="Matched" value={e.status.MATCHED} />
        <StatCard label="Fulfilled" value={e.status.FULFILLED} tone={e.status.FULFILLED > 0 ? "good" : "default"} />
        <StatCard label="All time" value={e.total} />
      </StatGrid>

      <div className="mt-4">
        <StatGrid cols={4}>
          <StatCard label="Time to first yes" value={span(e.performance.medianSecondsToYes)} hint="median, real requests" />
          <StatCard label="Got a yes" value={`${e.performance.gotYes} of ${e.performance.requests}`} hint="requests with someone coming" tone={e.performance.requests >= 3 && e.performance.gotYes < e.performance.requests ? "warn" : "default"} />
          <StatCard label="Answered" value={`${e.performance.answerRate}%`} hint={`${e.performance.yesRate}% said yes · ${e.performance.avgAlerted} alerted on average`} />
          <StatCard label="Needed to widen" value={e.performance.widened} hint="Pod could not cover it alone" />
        </StatGrid>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr] lg:gap-6">
        <Panel title="Latest requests" subtitle="Most recent 50.">
          {e.rows.length === 0 ? (
            <EmptyState title="No requests yet" />
          ) : (
            <ul className="divide-y-[0.5px] divide-hairline">
              {e.rows.map((r) => (
                <li key={r.id} className="flex items-center gap-3 py-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-light text-caption font-extrabold text-red-fg">
                    {BLOOD_TYPE_LABELS[r.bloodType]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-body-sm font-semibold text-ink">{r.facility}</span>
                    <span className="block truncate text-caption text-ink-muted">
                      {r.isTest ? "TEST · " : ""}{r.requester.name ?? "Unknown"} · {longDate(r.createdAt)} · {r.recipients.length} alerted, {r.recipients.filter((x) => x.answer === "COMING").length} coming{r.widenedAt ? ", widened" : ""}
                    </span>
                  </span>
                  <Badge tone={URGENCY_TONE[r.urgency]}>{r.urgency.toLowerCase()}</Badge>
                  <Badge tone={STATUS_TONE[r.status]}>{r.status.toLowerCase()}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Card>
          <h2 className="text-body-sm font-bold text-ink lg:text-title">Most requested types</h2>
          <div className="mt-4">
            {e.byType.length === 0 ? <EmptyState title="No data yet" /> : <HBars rows={e.byType} />}
          </div>
        </Card>
      </div>
    </div>
  );
}
