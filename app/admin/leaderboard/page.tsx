import { requireAdmin } from "@/lib/admin/auth";
import { getLeaderboard, type LeaderboardBy } from "@/lib/admin/garden-leaderboard";
import { EmptyState, FilterTabs, PageTitle } from "@/components/admin/ui";
import { LeaderboardPoster } from "@/components/admin/LeaderboardPoster";

export default async function AdminLeaderboardPage({ searchParams }: { searchParams: Promise<{ by?: string }> }) {
  await requireAdmin();
  const { by: raw } = await searchParams;
  const by: LeaderboardBy = raw === "weeks" ? "weeks" : "people";
  const rows = await getLeaderboard(by, 15);
  const label = new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return (
    <div>
      <PageTitle
        title="Garden leaders"
        subtitle="Who is building and tending the biggest Gardens. Make a poster of the top 10 to post."
      />

      <div className="mb-5">
        <FilterTabs
          active={by}
          items={[
            { id: "people", label: "Most ready people", href: "/admin/leaderboard" },
            { id: "weeks", label: "Most tended weeks", href: "/admin/leaderboard?by=weeks" },
          ]}
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No Gardens yet" body="Once people have verified, eligible people in the Pods they lead, they will show up here." />
      ) : (
        <LeaderboardPoster rows={rows} by={by} label={label} />
      )}
    </div>
  );
}
