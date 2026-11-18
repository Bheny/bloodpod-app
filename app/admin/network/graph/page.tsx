import { requireAdmin } from "@/lib/admin/auth";
import { getNetworkGraph } from "@/lib/admin/graph";
import { FilterTabs, PageTitle } from "@/components/admin/ui";
import { NetworkGraph } from "@/components/admin/NetworkGraph";

export default async function AdminNetworkGraphPage() {
  await requireAdmin();
  const data = await getNetworkGraph();

  return (
    <div>
      <PageTitle title="Network" subtitle="Every person, Pod and hospital, and how they connect." />

      <div className="mb-5">
        <FilterTabs
          active="graph"
          items={[
            { id: "overview", label: "Overview", href: "/admin/network" },
            { id: "graph", label: "Graph", href: "/admin/network/graph" },
            { id: "map", label: "Map", href: "/admin/network/map" },
          ]}
        />
      </div>

      <NetworkGraph data={data} />

      {data.stats.invites === 0 && data.stats.people > 0 && (
        <p className="mt-4 rounded-2xl border border-dashed border-hairline bg-white/60 px-4 py-3 text-caption text-ink-muted">
          Invite chains start appearing as new people join through an invite. Joins from before tracking began show
          their Pod links but not who brought them in.
        </p>
      )}
    </div>
  );
}
