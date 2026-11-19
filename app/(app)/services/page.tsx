import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { searchServices } from "@/lib/services";
import { isServiceTestId, type ServiceTestId } from "@/lib/service-tests";
import { AppHeader } from "@/components/layout/AppHeader";
import { ServicesFinder } from "@/components/services/ServicesFinder";

export default async function ServicesPage({ searchParams }: { searchParams: Promise<{ test?: string | string[] }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user.hospitalId) redirect("/hospital");
  if (user.labId) redirect("/lab");
  if (!user.onboardingComplete) redirect("/onboarding");

  // ?test=genotype&test=blood-group, so a search can be shared or bookmarked.
  const sp = await searchParams;
  const raw = Array.isArray(sp.test) ? sp.test : sp.test ? [sp.test] : [];
  const selected = raw.filter(isServiceTestId) as ServiceTestId[];

  const { results, origin } = await searchServices(
    { latitude: user.latitude, longitude: user.longitude, city: user.city },
    selected,
  );

  return (
    <div>
      <AppHeader
        wide
        title="Services"
        subtitle="Find a lab near you for the tests that matter"
        actions={
          <Link
            href="/services/bookings"
            className="rounded-full bg-surface px-4 py-2.5 text-body-sm font-bold text-ink-mid transition-colors hover:bg-hairline lg:bg-white lg:shadow-raised"
          >
            My bookings
          </Link>
        }
      />
      <ServicesFinder
        selected={selected}
        results={results}
        origin={origin}
        me={user.latitude !== null && user.longitude !== null ? { lat: user.latitude, lng: user.longitude } : null}
      />
    </div>
  );
}
