import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Users, Settings, UserPlus } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPodDetail } from "@/lib/pod-data";
import { getOrCreateShareInvite, inviteUrlFor } from "@/lib/pod-invite";
import { isPodFull } from "@/lib/pod-limits";
import { getDependableForPods } from "@/lib/pod-dependable";
import { DependableCard } from "@/components/pod/DependableCard";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { PodGarden } from "@/components/pod/PodGarden";
import { InviteCard } from "@/components/pod/InviteCard";
import { MemberList } from "@/components/pod/MemberList";
import { PodReadyCard } from "@/components/dashboard/PodReadyCard";
import { getPodReadiness } from "@/lib/readiness/drill";
import { ReadinessCard } from "@/components/readiness/ReadinessCard";

export default async function PodDetailPage({ params }: { params: Promise<{ podId: string }> }) {
  const { podId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardingComplete) redirect("/onboarding");

  const pod = await getPodDetail(user.id, podId);
  if (!pod) notFound();

  const isOwner = pod.role === "owner";
  const [shareInvite, dependableMap] = await Promise.all([
    isOwner ? getOrCreateShareInvite(pod.id, user.id) : Promise.resolve(null),
    getDependableForPods([pod.id]),
  ]);
  const dependable = dependableMap.get(pod.id);

  // Every Pod leader can check their Pod is ready. Members do not see this card.
  const readiness = isOwner ? await getPodReadiness(pod.id) : null;
  const hasOtherMembers = pod.members.length > 1;
  const readyCount = pod.members.filter((m) => m.isEligible).length;
  const inviteHref = `/pod/${pod.id}/invite`;

  return (
    <div>
      <AppHeader
        wide
        backHref="/pod"
        title={pod.name}
        subtitle={
          isOwner
            ? `${pod.memberCount} member${pod.memberCount === 1 ? "" : "s"} · ${pod.bloodTypesCovered.length} blood types`
            : `Owned by ${pod.ownerName} · ${pod.memberCount} member${pod.memberCount === 1 ? "" : "s"}`
        }
        actions={
          <>
            {isOwner && (
              <Link
                href={inviteHref}
                className="hidden items-center gap-1.5 rounded-full bg-red px-4 py-2.5 text-body-sm font-bold text-white transition-transform active:scale-95 lg:flex"
              >
                <UserPlus className="size-4" /> Invite
              </Link>
            )}
            <Link
              href={`/pod/${pod.id}/settings`}
              aria-label="Pod settings"
              className="flex size-10 items-center justify-center rounded-full bg-surface transition-colors hover:bg-hairline lg:bg-card lg:shadow-raised"
            >
              <Settings className="size-4.5 text-ink-mid" />
            </Link>
          </>
        }
      />

      <div className="flex flex-col gap-3.5 px-3.5 pb-8 pt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-6 lg:px-0 lg:pb-8 lg:pt-0">
        <div className="contents lg:flex lg:flex-col lg:gap-6">
          <div className="order-2 lg:order-0">
            <PodGarden
              members={pod.members}
              covered={pod.bloodTypesCovered}
              gaps={pod.bloodTypeGaps}
              inviteHref={isOwner && !isPodFull(pod.memberCount) ? inviteHref : undefined}
            />
          </div>

          <div className="order-3 lg:order-0">
            <Card className="overflow-hidden p-0 lg:p-0">
              <div className="px-4 pt-4 lg:px-6 lg:pt-6">
                <CardTitle>Members</CardTitle>
              </div>

              {hasOtherMembers ? (
                <div className="mt-2 pb-2">
                  <MemberList members={pod.members} />
                </div>
              ) : (
                <div className="px-4 py-10 text-center lg:px-6">
                  <Users className="mx-auto size-9 text-ink-faint" />
                  <p className="mt-3 text-body-sm font-bold text-ink lg:text-title">Nobody else is here yet.</p>
                  {isOwner && (
                    <>
                      <p className="mx-auto mt-1 max-w-xs text-caption text-ink-muted lg:text-body-sm">
                        A Pod only works with people in it. Share your invite link to bring in the first few.
                      </p>
                      <Link
                        href={inviteHref}
                        className="mt-4 inline-flex rounded-full bg-red px-6 py-3 text-body-sm font-bold text-white"
                      >
                        Invite people
                      </Link>
                    </>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>

        <div className="contents lg:sticky lg:top-8 lg:flex lg:flex-col lg:gap-6">
          {readiness && (
            <div className="order-1 lg:order-0">
              <ReadinessCard podId={pod.id} readiness={readiness} />
            </div>
          )}
          <div className="order-1 lg:order-0">
            <PodReadyCard
              podName={pod.name}
              memberCount={pod.memberCount}
              readyCount={readyCount}
              members={pod.members.slice(0, 5)}
              compact
            />
          </div>
          {dependable && (
            <div className="order-2 lg:order-0">
              <DependableCard result={dependable} showTip={isOwner} />
            </div>
          )}
          {shareInvite && (
            <div className="order-4 lg:order-0">
              <InviteCard
                podName={pod.name}
                inviteUrl={inviteUrlFor(shareInvite.token)}
                inviteCode={shareInvite.code}
                full={isPodFull(pod.memberCount)}
                moreHref={inviteHref}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
