import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPodDetail, getPodPendingInvites } from "@/lib/pod-data";
import { getOrCreateShareInvite, inviteUrlFor } from "@/lib/pod-invite";
import { isPodFull } from "@/lib/pod-limits";
import { AppHeader } from "@/components/layout/AppHeader";
import { InviteOptions } from "@/components/invite/InviteOptions";
import { PendingInvites } from "@/components/invite/PendingInvites";
import { PodFullNotice } from "@/components/invite/PodFullNotice";

export default async function PodInvitePage({ params }: { params: Promise<{ podId: string }> }) {
  const { podId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardingComplete) redirect("/onboarding");

  const pod = await getPodDetail(user.id, podId);
  if (!pod) notFound();
  // Only the owner invites; members just see the Pod.
  if (pod.role !== "owner") redirect(`/pod/${pod.id}`);

  const header = (
    <AppHeader title="Invite members" subtitle={`Share ${pod.name} with your circle`} backHref={`/pod/${pod.id}`} />
  );

  if (isPodFull(pod.memberCount, pod.slotLimit)) {
    return (
      <div>
        {header}
        <PodFullNotice />
      </div>
    );
  }

  const [shareInvite, pendingInvites] = await Promise.all([
    getOrCreateShareInvite(pod.id, user.id),
    getPodPendingInvites(pod.id),
  ]);

  return (
    <div>
      {header}

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
