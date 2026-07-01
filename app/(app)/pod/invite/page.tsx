import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPodData } from "@/lib/pod-data";
import { getOrCreateShareInvite, inviteUrlFor } from "@/lib/pod-invite";
import { isPodFull } from "@/lib/pod-limits";
import { AppHeader } from "@/components/layout/AppHeader";
import { InviteOptions } from "@/components/invite/InviteOptions";
import { PendingInvites } from "@/components/invite/PendingInvites";
import { PodFullNotice } from "@/components/invite/PodFullNotice";

export default async function PodInvitePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardingComplete) redirect("/onboarding");

  const { pod, pendingInvites } = await getPodData(user.id);
  if (!pod) redirect("/dashboard");

  if (isPodFull(pod.memberCount, user.plan)) {
    return (
      <div>
        <AppHeader
          title="Invite members"
          subtitle={`Share ${pod.name} with your circle`}
          backHref="/pod"
        />
        <PodFullNotice />
      </div>
    );
  }

  const shareInvite = await getOrCreateShareInvite(pod.id, user.id);

  return (
    <div>
      <AppHeader
        title="Invite members"
        subtitle={`Share ${pod.name} with your circle`}
        backHref="/pod"
      />

      <InviteOptions
        podId={pod.id}
        podName={pod.name}
        inviteUrl={inviteUrlFor(shareInvite.token)}
        inviteCode={shareInvite.code}
      />

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
