import { AlertTriangle } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { getNetwork, POD_READY_THRESHOLD } from "@/lib/admin/metrics";
import { longDate, pct } from "@/lib/admin/format";
import { EmptyState, FilterTabs, HBars, PageTitle, Panel, StatCard, StatGrid } from "@/components/admin/ui";
import { BarChart, Donut } from "@/components/admin/charts";

export default async function AdminNetworkPage() {
  await requireAdmin();
  const n = await getNetwork();

  const gaps = n.bloodTypes.filter((b) => b.eligible === 0);
  const acceptRate = pct(n.invites.accepted, n.invites.sent);

  return (
    <div>
      <PageTitle title="Network" subtitle="How the circles are forming, and whether they could answer an emergency today." />

      <div className="mb-5">
        <FilterTabs
          active="overview"
          items={[
            { id: "overview", label: "Overview", href: "/admin/network" },
            { id: "graph", label: "Graph", href: "/admin/network/graph" },
          { id: "map", label: "Map", href: "/admin/network/map" },
          ]}
        />
      </div>

      <StatGrid cols={5}>
        <StatCard label="Pods" value={n.totalPods} />
        <StatCard label="People in Pods" value={n.totalPeople} hint="owners and members" />
        <StatCard label="Average size" value={n.avgSize} hint="people per Pod" />
        <StatCard
          label="Pods ready"
          value={n.readyPods}
          tone={n.totalPods > 0 && n.readyPods === 0 ? "warn" : "default"}
          hint={`${POD_READY_THRESHOLD}+ can donate now`}
        />
        <StatCard
          label="Owner only"
          value={n.ownerOnlyPods}
          tone={n.ownerOnlyPods > 0 && pct(n.ownerOnlyPods, n.totalPods) > 50 ? "warn" : "default"}
          hint="nobody else joined"
        />
      </StatGrid>

      {gaps.length > 0 && n.totalPeople > 0 && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-mid bg-red-light/50 p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-fg" />
          <p className="text-body-sm text-ink">
            <span className="font-bold">Blood type gaps:</span> nobody who can donate right now has{" "}
            {gaps.map((g) => g.label).join(", ")}. Recruit for these first.
          </p>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <Panel title="Blood type coverage" subtitle="Donors by type. The number in grey can donate right now.">
          {n.bloodTypes.every((b) => b.total === 0) ? (
            <EmptyState title="No donors with a blood type yet" />
          ) : (
            <Donut centerLabel="donors" slices={n.bloodTypes.filter((b) => b.total > 0).map((b) => ({ label: `${b.label} (${b.eligible} ready)`, value: b.total }))} />
          )}
        </Panel>

        <Panel title="Pod sizes" subtitle="A Pod is most useful once it has several people in it.">
          {n.totalPods === 0 ? (
            <EmptyState title="No Pods yet" />
          ) : (
            <BarChart data={n.sizeDistribution.map((r) => ({ label: r.label, value: r.value }))} />
          )}
        </Panel>

        <Panel title="Where donors are" subtitle="Top cities by onboarded donors.">
          {n.cities.length === 0 ? <EmptyState title="No cities yet" /> : <HBars color="var(--color-ink-mid)" rows={n.cities.map((c) => ({ label: c.city, value: c.value }))} />}
        </Panel>

        <Panel title="Invites" subtitle={n.invites.sent ? `${acceptRate}% of invitations led to someone joining` : "People who joined through a link, code or email"}>
          {n.invites.sent === 0 ? (
            <EmptyState title="No one has joined through an invite yet" />
          ) : (
            <Donut
              centerLabel="invites"
              slices={[
                { label: "Joined", value: n.invites.accepted, color: "#1FA855" },
                { label: "Email invites waiting", value: n.invites.pending, color: "#F59E0B" },
                { label: "Email invites expired", value: n.invites.expired, color: "#8E8E93" },
              ]}
            />
          )}
        </Panel>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr] lg:gap-6">
        <Panel title="People joining Pods" subtitle="New members per week, last 12 weeks.">
          {n.weeklyJoins.length < 2 ? <EmptyState title="Not enough data yet" body="Needs at least two weeks of joins." /> : <BarChart data={n.weeklyJoins} />}
        </Panel>

        <Panel title="Biggest Pods">
          {n.topPods.length === 0 ? (
            <EmptyState title="No Pods yet" />
          ) : (
            <ul className="divide-y-[0.5px] divide-hairline">
              {n.topPods.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate text-body-sm font-semibold text-ink">{p.name}</span>
                    <span className="block truncate text-caption text-ink-muted">
                      {p.owner} · since {longDate(p.createdAt)}
                    </span>
                  </span>
                  <span className="shrink-0 text-body-sm font-extrabold tabular-nums text-ink">{p.size}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
