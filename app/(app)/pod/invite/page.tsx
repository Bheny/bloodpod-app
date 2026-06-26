import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPodData } from "@/lib/pod-data";
import { AppHeader } from "@/components/layout/AppHeader";
import { InviteOptions } from "@/components/invite/InviteOptions";
import { PendingInvites } from "@/components/invite/PendingInvites";

export default async function PodInvitePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardingComplete) redirect("/onboarding");

  const { pod, pendingInvites } = await getPodData(user.id);
  if (!pod) redirect("/dashboard");

  return (
    <div>
      <AppHeader
        title="Invite members"
        subtitle={`Share ${pod.name} with your circle`}
        backHref="/pod"
      />

      <InviteOptions podId={pod.id} podName={pod.name} podSlug={pod.slug} />

      <PendingInvites
        initialInvites={pendingInvites.map((inv) => ({
          id: inv.id,
          email: inv.email,
          token: inv.token,
          status: inv.status,
          createdAt: inv.createdAt.toISOString(),
          expiresAt: inv.expiresAt.toISOString(),
        }))}
      />
    </div>
  );
}
