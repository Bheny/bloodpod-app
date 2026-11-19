import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPodDetail } from "@/lib/pod-data";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/layout/AppHeader";
import { PodSettings } from "@/components/pod/PodSettings";

export default async function PodSettingsPage({ params }: { params: Promise<{ podId: string }> }) {
  const { podId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardingComplete) redirect("/onboarding");

  const pod = await getPodDetail(user.id, podId);
  if (!pod) notFound();

  const isOwner = pod.role === "owner";
  const ownedCount = isOwner ? await prisma.pod.count({ where: { ownerId: user.id } }) : 0;

  return (
    <div>
      <AppHeader title="Pod settings" subtitle={pod.name} backHref={`/pod/${pod.id}`} />
      <PodSettings
        podId={pod.id}
        podName={pod.name}
        viewerId={user.id}
        isOwner={isOwner}
        canDelete={ownedCount > 1}
        members={pod.members
          .filter((m) => !m.isOwner)
          .map((m) => ({ id: m.id, name: m.name, bloodType: m.bloodType }))}
      />
    </div>
  );
}
