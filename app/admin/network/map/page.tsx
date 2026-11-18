import { requireAdmin } from "@/lib/admin/auth";
import { getMapData } from "@/lib/admin/map";
import { FilterTabs, PageTitle } from "@/components/admin/ui";
import { DonorMap } from "@/components/admin/DonorMap";

export default async function AdminNetworkMapPage() {
  await requireAdmin();
  const data = await getMapData();

  return (
    <div>
      <PageTitle title="Network" subtitle="Where donors are, and who each hospital could reach." />

      <div className="mb-5">
        <FilterTabs
          active="map"
          items={[
            { id: "overview", label: "Overview", href: "/admin/network" },
            { id: "graph", label: "Graph", href: "/admin/network/graph" },
            { id: "map", label: "Map", href: "/admin/network/map" },
          ]}
        />
      </div>

      <DonorMap data={data} />
    </div>
  );
}
