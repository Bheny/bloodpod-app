import { redirect } from "next/navigation";
import Link from "next/link";
import { Users } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPodData } from "@/lib/pod-data";
import { PodHeader } from "@/components/pod/PodHeader";
import { BloodTypeCoverage } from "@/components/pod/BloodTypeCoverage";
import { MemberList } from "@/components/pod/MemberList";

export default async function PodPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardingComplete) redirect("/onboarding");

  const { pod } = await getPodData(user.id);
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
    </div>
  );
}
