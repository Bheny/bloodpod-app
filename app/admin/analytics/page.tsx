import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { getAnalytics, getRetention } from "@/lib/admin/analytics";
import { getNudgeStats } from "@/lib/admin/nudges";
import { getSetupDropOff } from "@/lib/admin/onboarding";
import { delta, shortDate } from "@/lib/admin/format";
import { Delta, EmptyState, FilterTabs, Funnel, HBars, PageTitle, Panel, StatCard, StatGrid } from "@/components/admin/ui";
import { BarChart, DONUT_COLORS, Donut, LineChart } from "@/components/admin/charts";
import { cn } from "@/lib/utils";

const RANGES = [7, 30, 90] as const;

const COUNTRY = new Intl.DisplayNames(["en"], { type: "region" });
const countryName = (code: string) => {
  try {
    return COUNTRY.of(code) ?? code;
  } catch {
    return code;
  }
};
const DEVICE: Record<string, string> = { mobile: "Phone", tablet: "Tablet", desktop: "Computer" };
const AREA: Record<string, string> = {
  dashboard: "Home",
  pod: "My Pod",
  discover: "Discover",
  services: "Services",
  profile: "Profile",
  care: "Care",
  garden: "Garden",
  "get-started": "Get started",
  essentials: "Essentials",
  "medical-id": "Medical ID",
  "medical-history": "Medical history",
  activity: "Activity",
  upgrade: "Plans",
  onboarding: "Setting up",
};

export default async function AdminAnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const range = (RANGES as readonly number[]).includes(Number(sp.range)) ? Number(sp.range) : 30;

  const a = await getAnalytics(range);
  const retention = await getRetention(a.trackingSince);
  const nudges = await getNudgeStats(range);
  const setup = await getSetupDropOff(range);
  const empty = a.trackingSince === null;

  return (
    <div>
      <PageTitle
        title="Analytics"
        subtitle={
          empty
            ? "Counting starts with the next visit."
            : `Our own count, no third party. Since ${shortDate(a.trackingSince!)}. Admins and bots are left out.`
        }
        actions={
          <FilterTabs
            active={String(range)}
            items={RANGES.map((r) => ({ id: String(r), label: `${r}d`, href: `/admin/analytics?range=${r}` }))}
          />
        }
      />

      {/* Right now */}
      <section aria-labelledby="live" className="mb-6">
        <h2 id="live" className="mb-3 text-body-sm font-bold text-ink lg:text-title">
          Right now
        </h2>
        <StatGrid cols={6}>
          <StatCard label="Active now" value={a.live.now} hint="visitors in the last 5 minutes" tone={a.live.now > 0 ? "good" : "default"} />
          <StatCard label="Last 30 minutes" value={a.live.last30} hint="visitors" />
          <StatCard label="Members on now" value={a.live.membersNow} hint="signed in, last 5 minutes" />
          <StatCard label="Daily members" value={a.members.dau} hint="signed in, past 24 hours" />
          <StatCard label="Weekly members" value={a.members.wau} hint="signed in, past 7 days" />
          <StatCard
            label="Monthly members"
            value={a.members.mau}
            hint={a.members.mau ? `${a.members.stickiness}% come back daily` : "signed in, past 30 days"}
          />
        </StatGrid>
      </section>

      {/* Headline */}
      <StatGrid cols={4}>
        <StatCard
          label="Unique visitors"
          value={a.current.visitors}
          delta={<Delta value={delta(a.current.visitors, a.previous.visitors)} />}
          hint={`vs the ${range} days before`}
          spark={a.visitorsSeries.map((p) => p.value)}
        />
        <StatCard
          label="Page views"
          value={a.current.views}
          delta={<Delta value={delta(a.current.views, a.previous.views)} />}
          hint={`${a.pagesPerVisit} pages per visit`}
          spark={a.viewsSeries.map((p) => p.value)}
        />
        <StatCard
          label="Left after one page"
          value={`${a.bounceRate}%`}
          hint={`of ${a.current.visits} visits`}
          tone={a.current.visits >= 20 && a.bounceRate > 70 ? "warn" : "default"}
        />
        <StatCard label="Installed app" value={`${a.installedShare}%`} hint="of visitors opened it from the home screen" />
      </StatGrid>

      {/* Trend */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <Panel title="Visitors per day" subtitle={`Last ${range} days, each person counted once a day`}>
          <LineChart data={a.visitorsSeries} />
        </Panel>
        <Panel title="New and returning" subtitle="A returning visitor has been here before this period">
          {a.fresh + a.returning === 0 ? (
            <EmptyState title="No visits yet" />
          ) : (
            <Donut
              size={120}
              centerLabel="visitors"
              slices={[
                { label: "New", value: a.fresh, color: DONUT_COLORS[0] },
                { label: "Returning", value: a.returning, color: DONUT_COLORS[3] },
              ]}
            />
          )}
        </Panel>
      </div>

      {/* Conversion */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr] lg:gap-6">
        <Panel title="From visit to ready" subtitle="Where visitors fall away on the way to a finished account.">
          {a.current.visitors === 0 ? <EmptyState title="No visitors yet" /> : <Funnel steps={a.funnel} />}
        </Panel>
        <Panel title="Where visits start" subtitle="The first page of each visit">
          {a.landings.length === 0 ? (
            <EmptyState title="Nothing yet" />
          ) : (
            <HBars rows={a.landings.map((r) => ({ label: r.path, value: r.visits }))} />
          )}
        </Panel>
      </div>

      {/* Sources and people */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        <Panel title="How people find us" subtitle="Visits by where they came from">
          {a.sources.length === 0 ? (
            <EmptyState title="Nothing yet" />
          ) : (
            <HBars rows={a.sources.map((r) => ({ label: r.source === "direct" ? "Direct or unknown" : r.source, value: r.visits }))} />
          )}
        </Panel>
        <Panel title="Devices" subtitle="Visitors by device">
          {a.devices.length === 0 ? (
            <EmptyState title="Nothing yet" />
          ) : (
            <Donut
              size={120}
              centerLabel="visitors"
              slices={a.devices.map((d, i) => ({ label: DEVICE[d.device] ?? d.device, value: d.visitors, color: DONUT_COLORS[i % DONUT_COLORS.length] }))}
            />
          )}
        </Panel>
        <Panel title="Where they are" subtitle="Visitors by country, then Ghana by city">
          {a.countries.length === 0 ? (
            <EmptyState title="Nothing yet" body="Location comes from the host and only fills in once the site is live." />
          ) : (
            <div className="space-y-5">
              <HBars rows={a.countries.map((r) => ({ label: countryName(r.country), value: r.visitors }))} />
              {a.cities.length > 0 && <HBars color="#1D4ED8" rows={a.cities.map((r) => ({ label: r.city, value: r.visitors }))} />}
            </div>
          )}
        </Panel>
      </div>

      {/* What people use */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <Panel title="What members use" subtitle="Signed-in people who opened each part of the app">
          {a.areas.length === 0 ? (
            <EmptyState title="No member activity yet" />
          ) : (
            <HBars
              rows={a.areas.map((r) => ({
                label: AREA[r.area] ?? r.area,
                value: r.members,
                sub: `${r.views} views`,
              }))}
            />
          )}
        </Panel>
        <Panel title="Top pages" subtitle="Views, and how many different people">
          {a.pages.length === 0 ? (
            <EmptyState title="Nothing yet" />
          ) : (
            <HBars rows={a.pages.map((r) => ({ label: r.path, value: r.views, sub: `${r.visitors} ${r.visitors === 1 ? "person" : "people"}` }))} />
          )}
        </Panel>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr] lg:gap-6">
        <Panel title="When people are here" subtitle="Page views by hour of the day (Accra time)">
          <BarChart data={a.hourly} />
        </Panel>

        <Panel title="Do new members come back?" subtitle="Share of each week's new accounts who opened the app again">
          {retention.length === 0 ? (
            <EmptyState title="Not enough yet" body="This fills in once people who sign up after counting began have had a week or two to return." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-caption">
                <thead>
                  <tr className="text-left text-ink-muted">
                    <th className="py-1.5 pr-3 font-semibold">Joined week of</th>
                    <th className="px-2 py-1.5 font-semibold">People</th>
                    {["Wk 0", "Wk 1", "Wk 2", "Wk 3", "Wk 4"].map((h) => (
                      <th key={h} className="px-2 py-1.5 text-right font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {retention.map((r) => (
                    <tr key={r.cohort} className="border-t-[0.5px] border-hairline">
                      <td className="py-2 pr-3 font-semibold text-ink">{shortDate(r.cohort)}</td>
                      <td className="px-2 py-2 tabular-nums text-ink-muted">{r.size}</td>
                      {r.weeks.map((w, i) => (
                        <td key={i} className="px-2 py-2 text-right tabular-nums">
                          {w === null ? (
                            <span className="text-ink-faint">·</span>
                          ) : (
                            <span
                              className={cn("inline-block min-w-10 rounded-md px-1.5 py-0.5 font-bold", w >= 40 ? "bg-red text-white" : w >= 15 ? "bg-red-light text-red-fg" : "bg-surface text-ink-mid")}
                            >
                              {w}%
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-caption text-ink-muted">Week 0 is the week they joined, so it is usually the highest.</p>
            </div>
          )}
        </Panel>
      </div>

      {/* Where sign-ups stop */}
      <div className="mt-6">
        <Panel
          title="Where people stop in setup"
          subtitle={`Of ${setup.signedUp} sign-ups in the last ${range} days, ${setup.finished} finished (${setup.finishedShare}%). Each person is placed at the first thing they have not given us.`}
          actions={
            <Link href="/admin/users?status=stalled" className="text-caption font-bold text-red-fg">
              See them
            </Link>
          }
        >
          {setup.stuck === 0 ? (
            <EmptyState title="Nobody is stuck" body="Everyone who signed up in this time has finished." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-120 text-left text-body-sm">
                <thead>
                  <tr className="text-label font-bold uppercase tracking-wide text-ink-muted">
                    <th className="py-2 pr-3">They stopped at</th>
                    <th className="px-2 py-2 text-right">This week</th>
                    <th className="px-2 py-2 text-right">Earlier</th>
                    <th className="py-2 pl-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {setup.stages.map((s) => (
                    <tr key={s.id} className="border-t-[0.5px] border-hairline">
                      <td className="py-2 pr-3">
                        <span className="block font-bold text-ink">{s.label}</span>
                        <span className="block text-caption text-ink-muted">{s.hint}</span>
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums">{s.recent}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{s.older}</td>
                      <td className="py-2 pl-2 text-right font-bold tabular-nums">{s.recent + s.older}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {setup.biggest && (
                <p className="mt-3 text-caption text-ink-muted">
                  Most people stop at <span className="font-bold text-ink">{setup.biggest.label.toLowerCase()}</span>. If that step is asking too much, make it easier before chasing people.
                  Friendly emails go out at 1 and 4 days, then stop.
                </p>
              )}
            </div>
          )}
        </Panel>
      </div>

      {/* The nudge bot */}
      <div className="mt-6">
        <Panel
          title="Nudges"
          subtitle={`Friendly prompts to grow Pods, last ${range} days. ${nudges.switchedOff} ${nudges.switchedOff === 1 ? "person has" : "people have"} switched them off (${nudges.switchedOffShare}%).`}
        >
          {nudges.shown === 0 ? (
            <EmptyState title="No nudges yet" body="They start once people have been here a couple of days." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-120 text-left text-body-sm">
                <thead>
                  <tr className="text-label font-bold uppercase tracking-wide text-ink-muted">
                    <th className="py-2 pr-3">Nudge</th>
                    <th className="px-2 py-2 text-right">Shown</th>
                    <th className="px-2 py-2 text-right">Pushed</th>
                    <th className="px-2 py-2 text-right">Emailed</th>
                    <th className="px-2 py-2 text-right">Not now</th>
                    <th className="px-2 py-2 text-right">Did it</th>
                    <th className="py-2 pl-2 text-right">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {nudges.kinds.map((k) => (
                    <tr key={k.kind} className="border-t-[0.5px] border-hairline">
                      <td className="py-2 pr-3 font-bold text-ink">{k.label}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{k.shown}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{k.pushed}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{k.emailed}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{k.dismissed}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{k.acted}</td>
                      <td className="py-2 pl-2 text-right font-bold tabular-nums">{k.shown > 0 ? `${k.actRate}%` : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-caption text-ink-muted">
                Overall {nudges.actRate}% of nudges were acted on. A nudge that keeps being closed is worth rewording or removing.
              </p>
            </div>
          )}
        </Panel>
      </div>

      <p className="mt-6 text-center text-caption text-ink-muted">
        A visitor is one browser, so someone on a phone and a laptop counts twice, and clearing site data starts them over.
        People who turn on Do Not Track are not counted. Page views are kept for 13 months.
      </p>
    </div>
  );
}
