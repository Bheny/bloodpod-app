import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getDiscoverDonors } from "@/lib/discover-data";
import { AppHeader } from "@/components/layout/AppHeader";
import { DiscoverList } from "@/components/discover/DiscoverList";
import { VisibilityToggle } from "@/components/discover/VisibilityToggle";

export default async function DiscoverPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user.hospitalId) redirect("/hospital");
  if (user.labId) redirect("/lab");
  if (!user.onboardingComplete) redirect("/onboarding");

  const initial = await getDiscoverDonors(user.id, { city: user.city ?? undefined });
  if (!initial) redirect("/sign-in");

  return (
    <div>
      <AppHeader
        wide
        title="Discover"
        subtitle="Find donors near you by blood type and area"
        actions={
          <Link
            href="/discover/requests"
            className="flex min-h-10 items-center rounded-full bg-surface px-4 text-caption font-bold text-ink-mid transition-colors hover:bg-hairline lg:bg-card lg:shadow-raised"
          >
            My requests
          </Link>
        }
      />
      <VisibilityToggle initiallyPublic={user.isPublic} />
      <div className="mt-3 overflow-hidden rounded-2xl lg:bg-card lg:shadow-raised">
        <DiscoverList initial={initial} myCity={user.city} />
      </div>
    </div>
  );
}
