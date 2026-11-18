import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { getOverview, getPodSummary, getRecentSignups, getSignupSeries } from "@/lib/admin/metrics";
import { delta, ghs, pct, shortDate } from "@/lib/admin/format";
import { BLOOD_TYPE_LABELS } from "@/lib/blood-type";
import { Badge, Delta, EmptyState, FilterTabs, Funnel, PageTitle, Panel, StatCard } from "@/components/admin/ui";
import { LineChart } from "@/components/admin/charts";
import { cn } from "@/lib/utils";

const RANGES = [7, 30, 90] as const;
const TONE = { red: "bg-red", amber: "bg-[#F59E0B]", blue: "bg-[#3B82F6]" } as const;

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const range = (RANGES as readonly number[]).includes(Number(sp.range)) ? Number(sp.range) : 30;

  const [o, series, pods, recent] = await Promise.all([
    getOverview(),
    getSignupSeries(range),
    getPodSummary(),
    getRecentSignups(6),
  ]);

  const alertsPct = pct(o.withAlerts, o.donors);

  return (
    <div>
      <PageTitle title="Overview" subtitle="Where BloodPod stands right now." />

      {/* Needs attention */}
      <section aria-labelledby="attention" className="mb-6">
        <h2 id="attention" className="mb-3 text-body-sm font-bold text-ink lg:text-title">
          Needs your attention
        </h2>
        {o.attention.length === 0 ? (
          <div className="flex items-center gap-3 rounded-2xl border-[0.5px] border-hairline bg-white p-4 shadow-raised">
            <CheckCircle2 className="size-5 text-[#1FA855]" />
            <p className="text-body-sm font-semibold text-ink">Nothing needs you right now.</p>
          </div>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {o.attention.map((a) => (
              <li key={a.id}>
                <Link
                  href={a.href}
                  className="flex h-full items-start gap-3 rounded-2xl border-[0.5px] border-hairline bg-white p-4 shadow-raised transition-colors hover:border-red-mid"
                >
                  <span className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", TONE[a.tone])} />
                  <span>
                    <span className="block text-body-sm font-bold text-ink">{a.title}</span>
                    <span className="mt-0.5 block text-caption text-ink-muted">{a.detail}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Headline numbers */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4 xl:grid-cols-6">
        <StatCard label="Donors" value={o.donors} hint="signed up in total" href="/admin/users" />
        <StatCard
          label="New this week"
          value={o.new7}
          delta={<Delta value={delta(o.new7, o.newPrev7)} />}
          hint="vs last week"
          href="/admin/users"
        />
        <StatCard
          label="Ready to donate"
          value={o.eligible}
          hint={`${pct(o.eligible, o.onboarded)}% of onboarded`}
          href="/admin/users?status=eligible"
        />
        <StatCard
          label="Alerts on"
          value={`${alertsPct}%`}
          hint={`${o.withAlerts} of ${o.donors}`}
          tone={o.donors >= 5 && alertsPct < 50 ? "warn" : "default"}
          href="/admin/users?status=alertsOff"
        />
        <StatCard
          label="Pods"
          value={pods.total}
          hint={`${pods.ready} ready to answer`}
          href="/admin/network"
        />
        <StatCard
          label="Monthly revenue"
          value={ghs(o.mrrPesewas, { decimals: false })}
          hint={`${o.activeContracts} active contract${o.activeContracts === 1 ? "" : "s"}`}
          href="/admin/finance"
        />
      </div>

      {/* Growth */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2 lg:gap-6">
        <Panel
          title="Total donors"
          subtitle={`Last ${range} days`}
          actions={
            <FilterTabs
              active={String(range)}
              items={RANGES.map((r) => ({ id: String(r), label: `${r}d`, href: `/admin?range=${r}` }))}
            />
          }
        >
          <LineChart data={series.cumulative} />
        </Panel>
        <Panel
          title="New sign-ups per day"
          subtitle={`${o.new30} in the last 30 days, ${delta(o.new30, o.newPrev30) === null ? "none the 30 before" : `${delta(o.new30, o.newPrev30)}% vs the 30 before`}`}
        >
          <LineChart data={series.daily} color="#1C1C1E" />
        </Panel>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_1fr] lg:gap-6">
        <Panel title="From sign-up to ready" subtitle="How far new donors get. The biggest drop is where to focus.">
          {o.donors === 0 ? <EmptyState title="No donors yet" body="The funnel fills in as people sign up." /> : <Funnel steps={o.funnel} />}
        </Panel>

        <div className="flex flex-col gap-4 lg:gap-6">
          <Panel title="Hospital pipeline" actions={<Link href="/admin/hospitals" className="text-caption font-bold text-red">Open</Link>}>
            <div className="grid grid-cols-3 gap-2 text-center">
              {(
                [
                  ["Pending", o.hospitals.PENDING, "amber"],
                  ["Approved", o.hospitals.APPROVED, "green"],
                  ["Rejected", o.hospitals.REJECTED, "gray"],
                ] as const
              ).map(([label, n, tone]) => (
                <div key={label} className="rounded-xl bg-surface py-3">
                  <p className="text-[24px] font-extrabold leading-none text-ink">{n}</p>
                  <div className="mt-2">
                    <Badge tone={tone}>{label}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Latest sign-ups" actions={<Link href="/admin/users" className="text-caption font-bold text-red">See all</Link>}>
            {recent.length === 0 ? (
              <EmptyState title="Nobody yet" />
            ) : (
              <ul className="divide-y-[0.5px] divide-hairline">
                {recent.map((u) => (
                  <li key={u.id}>
                    <Link href={`/admin/users/${u.id}`} className="flex items-center gap-3 py-2.5">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-red-light text-caption font-bold text-red">
                        {u.bloodType ? BLOOD_TYPE_LABELS[u.bloodType] : "?"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-body-sm font-semibold text-ink">{u.name ?? "No name"}</span>
                        <span className="block truncate text-caption text-ink-muted">
                          {u.city ?? "No city"} · {shortDate(u.createdAt)}
                        </span>
                      </span>
                      {!u.onboardingComplete && <Badge tone="amber">Onboarding</Badge>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      {o.openEmergencies === 0 && (
        <p className="mt-6 text-center text-caption text-ink-muted">
          Emergency response times and show-up rates will appear here once the alert system is live.
        </p>
      )}
    </div>
  );
}
