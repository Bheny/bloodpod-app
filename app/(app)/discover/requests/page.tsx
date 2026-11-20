import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getSentRequests } from "@/lib/donor-requests";
import { AppHeader } from "@/components/layout/AppHeader";
import { RequestCard } from "@/components/discover/RequestCard";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

export default async function MyRequestsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user.hospitalId) redirect("/hospital");
  if (user.labId) redirect("/lab");
  if (!user.onboardingComplete) redirect("/onboarding");

  const rows = await getSentRequests(user.id);

  return (
    <div>
      <AppHeader wide backHref="/discover" title="My requests" subtitle="Donors you have asked for help" />

      <div className="flex max-w-xl flex-col gap-3 px-3.5 pb-28 pt-4 lg:px-0 lg:pb-8 lg:pt-0">
        {rows.length === 0 ? (
          <Card className="text-center">
            <p className="text-body-sm font-bold text-ink">You have not asked anyone yet</p>
            <p className="mt-1 text-caption text-ink-muted">
              Find a donor on Discover and tap Ask. You see their first name until they say yes.
            </p>
            <Link href="/discover" className="mt-4 inline-flex min-h-11 items-center rounded-full bg-red px-5 text-body-sm font-bold text-white">
              Find donors
            </Link>
          </Card>
        ) : (
          rows.map((row) => <RequestCard key={row.id} row={row} role="seeker" />)
        )}
      </div>
    </div>
  );
}
