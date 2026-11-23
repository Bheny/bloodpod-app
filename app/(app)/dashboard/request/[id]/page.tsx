import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getRequesterView } from "@/lib/alerts";
import { AppHeader } from "@/components/layout/AppHeader";
import { RequestTracker } from "@/components/alerts/RequestTracker";

export const dynamic = "force-dynamic";

export default async function FollowRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const { id } = await params;

  const view = await getRequesterView(user.id, id);
  if (!view) notFound();

  return (
    <div>
      <AppHeader title="Your request" subtitle="Who has been told and who can come" backHref="/dashboard" />
      <div className="px-3.5 pb-28 pt-4 lg:max-w-xl lg:px-0 lg:pb-8 lg:pt-0">
        <RequestTracker initial={view} />
      </div>
    </div>
  );
}
