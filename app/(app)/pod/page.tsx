import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, ChevronRight, Settings, UserPlus } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPodData, getJoinedPods } from "@/lib/pod-data";
import { getOrCreateShareInvite, inviteUrlFor } from "@/lib/pod-invite";
import { isPodFull } from "@/lib/pod-limits";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { PodGarden } from "@/components/pod/PodGarden";
import { PodInvitations } from "@/components/pod/PodInvitations";
import { getReceivedInvitations } from "@/lib/pod-invitations";
import { InviteCard } from "@/components/pod/InviteCard";
import { MemberList } from "@/components/pod/MemberList";
import { PodReadyCard } from "@/components/dashboard/PodReadyCard";

export default async function PodPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardingComplete) redirect("/onboarding");

  const [{ pod }, joinedPods, invitations] = await Promise.all([
    getPodData(user.id),
    getJoinedPods(user.id),
    getReceivedInvitations({ id: user.id, email: user.email }),
  ]);
  if (!pod) redirect("/dashboard");

  const shareInvite = await getOrCreateShareInvite(pod.id, user.id);
  const hasOtherMembers = pod.members.length > 1;
  const readyCount = pod.members.filter((m) => m.isEligible).length;

  return (
    <div>
      <AppHeader
        wide
        title={pod.name}
        subtitle={`${pod.memberCount} member${pod.memberCount === 1 ? "" : "s"} · ${pod.bloodTypesCovered.length} blood types`}
        actions={
          <>
            <Link
              href="/pod/invite"
              className="hidden items-center gap-1.5 rounded-full bg-red px-4 py-2.5 text-body-sm font-bold text-white transition-transform active:scale-95 lg:flex"
            >
              <UserPlus className="size-4" /> Invite
            </Link>
            <Link
              href="/pod/settings"
              aria-label="Pod settings"
              className="flex size-10 items-center justify-center rounded-full bg-surface transition-colors hover:bg-hairline lg:bg-white lg:shadow-raised"
            >
              <Settings className="size-[18px] text-ink-mid" />
            </Link>
          </>
        }
      />

      <div className="flex flex-col gap-3.5 px-3.5 pb-8 pt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-6 lg:px-0 lg:pb-8 lg:pt-0">
        <div className="contents lg:flex lg:flex-col lg:gap-6">
          {invitations.length > 0 && (
            <div className="order-1 lg:order-none">
              <PodInvitations invitations={invitations} />
            </div>
          )}

          <div className="order-2 lg:order-none">
            <PodGarden members={pod.members} covered={pod.bloodTypesCovered} gaps={pod.bloodTypeGaps} />
          </div>

          <div className="order-3 lg:order-none">
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
                  <p className="mx-auto mt-1 max-w-xs text-caption text-ink-muted lg:text-body-sm">
                    A Pod only works with people in it. Share your invite link to bring in the first few.
                  </p>
                  <Link
                    href="/pod/invite"
                    className="mt-4 inline-flex rounded-full bg-red px-6 py-3 text-body-sm font-bold text-white"
                  >
                    Invite people
                  </Link>
                </div>
              )}
            </Card>
          </div>

          {joinedPods.length > 0 && (
            <div className="order-5 lg:order-none">
              <Card>
                <CardTitle>Pods you&apos;ve joined</CardTitle>
                <div className="mt-3 flex flex-col gap-2">
                  {joinedPods.map((jp) => (
                    <Link
                      key={jp.id}
                      href={`/pod/joined/${jp.id}`}
                      className="flex items-center gap-3 rounded-xl border-[0.5px] border-hairline px-3.5 py-3 transition-colors hover:bg-surface"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface">
                        <Users className="size-5 text-ink-mid" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-body-sm font-bold text-ink">{jp.name}</p>
                        <p className="truncate text-caption text-ink-muted">
                          Owned by {jp.ownerName} · {jp.memberCount} member{jp.memberCount === 1 ? "" : "s"}
                        </p>
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-ink-faint" />
                    </Link>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>

        <div className="contents lg:sticky lg:top-8 lg:flex lg:flex-col lg:gap-6">
          <div className="order-1 lg:order-none">
            <PodReadyCard
              podName={pod.name}
              memberCount={pod.memberCount}
              readyCount={readyCount}
              members={pod.members.slice(0, 5)}
              compact
            />
          </div>
          <div className="order-4 lg:order-none">
            <InviteCard
              podName={pod.name}
              inviteUrl={inviteUrlFor(shareInvite.token)}
              inviteCode={shareInvite.code}
              full={isPodFull(pod.memberCount)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
