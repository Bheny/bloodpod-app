import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getJoinedPodDetail } from "@/lib/pod-data";
import { BloodTypeCoverage } from "@/components/pod/BloodTypeCoverage";
import { MemberList } from "@/components/pod/MemberList";

export default async function JoinedPodPage({
  params,
}: {
  params: Promise<{ podId: string }>;
}) {
  const { podId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardingComplete) redirect("/onboarding");

  const pod = await getJoinedPodDetail(user.id, podId);
  if (!pod) notFound();

  return (
    <div>
      <div className="border-b-[0.5px] border-[#E5E5EA] bg-white px-4 py-4">
        <div className="flex items-center gap-2.5">
          <Link
            href="/pod"
            aria-label="Back to your pod"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface"
          >
            <ChevronLeft className="size-4 text-ink-mid" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-extrabold tracking-[-0.4px] text-ink">{pod.name}</p>
            <p className="truncate text-[10px] text-ink-muted">Owned by {pod.ownerName}</p>
          </div>
        </div>

        <div className="mt-3.5 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-surface py-2.5 text-center">
            <p className="text-base font-extrabold text-ink">{pod.memberCount}</p>
            <p className="text-[9px] text-ink-muted">Members</p>
          </div>
          <div className="rounded-xl bg-surface py-2.5 text-center">
            <p className="text-base font-extrabold text-ink">{pod.bloodTypesCovered.length}</p>
            <p className="text-[9px] text-ink-muted">Types</p>
          </div>
        </div>
      </div>

      <BloodTypeCoverage covered={pod.bloodTypesCovered} gaps={pod.bloodTypeGaps} />

      <div className="mt-2 bg-white px-4 pt-3">
        <p className="text-[13px] font-bold text-ink">Members</p>
      </div>
      <div className="bg-white pb-2">
        <MemberList members={pod.members} />
      </div>
    </div>
  );
}
