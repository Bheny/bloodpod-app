import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, ChevronRight } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPodData, getJoinedPods } from "@/lib/pod-data";
import { PodHeader } from "@/components/pod/PodHeader";
import { BloodTypeCoverage } from "@/components/pod/BloodTypeCoverage";
import { MemberList } from "@/components/pod/MemberList";
import { PodStrengthMeter } from "@/components/pod/PodStrengthMeter";

export default async function PodPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardingComplete) redirect("/onboarding");

  const [{ pod }, joinedPods] = await Promise.all([getPodData(user.id), getJoinedPods(user.id)]);
  if (!pod) redirect("/dashboard");

  const hasOtherMembers = pod.members.length > 1;

  return (
    <div>
      <PodHeader
        podName={pod.name}
        podSlug={pod.slug}
        memberCount={pod.memberCount}
        strengthScore={pod.strengthScore}
        typesCount={pod.bloodTypesCovered.length}
      />

      {pod.strengthScore < 100 && (
        <div className="bg-white px-4 pb-3 pt-3">
          <PodStrengthMeter
            score={pod.strengthScore}
            steps={pod.strengthSteps}
            podName={pod.name}
          />
        </div>
      )}

      <BloodTypeCoverage covered={pod.bloodTypesCovered} gaps={pod.bloodTypeGaps} />

      <div className="mt-2 flex items-center justify-between bg-white px-4 pt-3">
        <p className="text-[13px] font-bold text-ink">Members</p>
        <Link href="/pod/invite" className="text-xs font-bold text-red">
          + Invite
        </Link>
      </div>

      {hasOtherMembers ? (
        <div className="bg-white pb-2">
          <MemberList members={pod.members} />
        </div>
      ) : (
        <div className="bg-white px-4 py-8 text-center">
          <Users className="mx-auto size-8 text-ink-faint" />
          <p className="mt-3 text-sm font-bold text-ink">No one will get the call.</p>
          <p className="mt-1 text-xs text-ink-muted">
            Your pod is empty. Add members to build your emergency network.
          </p>
          <Link
            href="/pod/invite"
            className="mt-4 block w-full rounded-full bg-red py-3 text-[10px] font-bold text-white"
          >
            Invite members
          </Link>
        </div>
      )}

      {hasOtherMembers && (
        <div className="px-4 py-3">
          <Link
            href="/pod/invite"
            className="block w-full rounded-full bg-red py-3 text-center text-[10px] font-bold text-white"
          >
            + Invite members
          </Link>
        </div>
      )}

      {joinedPods.length > 0 && (
        <div className="mt-2 px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">
            Pods you&apos;ve joined
          </p>
          <div className="mt-2 flex flex-col gap-2">
            {joinedPods.map((jp) => (
              <Link
                key={jp.id}
                href={`/pod/joined/${jp.id}`}
                className="flex items-center gap-3 rounded-2xl border-[0.5px] border-[#E5E5EA] bg-white px-3.5 py-3 transition-colors duration-150 hover:bg-surface"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-surface">
                  <Users className="size-4 text-ink-mid" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-bold text-ink">{jp.name}</p>
                  <p className="truncate text-[10px] text-ink-muted">
                    Owned by {jp.ownerName} · {jp.memberCount} member{jp.memberCount === 1 ? "" : "s"}
                  </p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-ink-faint" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
