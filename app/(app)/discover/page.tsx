import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getDiscoverDonors } from "@/lib/discover-data";
import { VisibilityToggle } from "@/components/discover/VisibilityToggle";
import { DiscoverList } from "@/components/discover/DiscoverList";

export default async function DiscoverPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardingComplete) redirect("/onboarding");

  const result = await getDiscoverDonors(user.id, { city: user.city ?? undefined });
  if (!result) redirect("/sign-in");

  return (
    <div>
      <div className="border-b-[0.5px] border-[#E5E5EA] bg-white px-4 py-3.5">
        <h1 className="text-[13px] font-extrabold tracking-[-0.4px] text-ink">Discover</h1>
        <p className="text-[9px] text-ink-muted">Find donors near you</p>
      </div>

      <VisibilityToggle initiallyPublic={result.viewer.isPublic} />

      <DiscoverList
        initialDonors={result.donors}
        initialTotal={result.total}
        myCity={result.viewer.city}
      />
    </div>
  );
}
