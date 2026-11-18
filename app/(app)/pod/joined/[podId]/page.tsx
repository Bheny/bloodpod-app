import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getJoinedPodDetail } from "@/lib/pod-data";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardTitle } from "@/components/ui/Card";
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
      <AppHeader
        wide
        backHref="/pod"
        title={pod.name}
        subtitle={`Owned by ${pod.ownerName} · ${pod.memberCount} member${pod.memberCount === 1 ? "" : "s"}`}
      />

      <div className="flex flex-col gap-3.5 px-3.5 pb-8 pt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-6 lg:px-0 lg:pt-0">
        <Card className="order-2 overflow-hidden p-0 lg:order-none lg:p-0">
          <div className="px-4 pt-4 lg:px-6 lg:pt-6">
            <CardTitle>Members</CardTitle>
          </div>
          <div className="mt-2 pb-2">
            <MemberList members={pod.members} />
          </div>
        </Card>

        <div className="order-1 lg:order-none lg:sticky lg:top-8">
          <BloodTypeCoverage covered={pod.bloodTypesCovered} gaps={pod.bloodTypeGaps} />
        </div>
      </div>
    </div>
  );
}
