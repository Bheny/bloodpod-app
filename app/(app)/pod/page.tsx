import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPodList } from "@/lib/pod-data";
import { getPodAllowance } from "@/lib/pod-access";
import { getDependableForPods } from "@/lib/pod-dependable";
import { getReceivedInvitations } from "@/lib/pod-invitations";
import { AppHeader } from "@/components/layout/AppHeader";
import { PodListCard } from "@/components/pod/PodListCard";
import { CreatePodCard } from "@/components/pod/CreatePodCard";
import { PodInvitations } from "@/components/pod/PodInvitations";

export default async function PodsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardingComplete) redirect("/onboarding");

  const [pods, allowance, invitations] = await Promise.all([
    getPodList(user.id),
    getPodAllowance(user.id),
    getReceivedInvitations({ id: user.id, email: user.email }),
  ]);

  const dependable = await getDependableForPods(pods.map((p) => p.id));
  const owned = pods.filter((p) => p.role === "owner");
  const joined = pods.filter((p) => p.role === "member");

  return (
    <div>
      <AppHeader wide title="Pods" subtitle="The circles you look out for, and the ones you're part of." />

      <div className="flex flex-col gap-5 px-3.5 pb-8 pt-4 lg:max-w-2xl lg:gap-6 lg:px-0 lg:pt-0">
        <PodInvitations invitations={invitations} />

        <section>
          <h2 className="mb-2.5 px-1 text-body-sm font-bold text-ink lg:text-title">Your Pods</h2>
          <div className="flex flex-col gap-3">
            {owned.map((pod) => (
              <PodListCard key={pod.id} pod={pod} dependable={dependable.get(pod.id)} />
            ))}
            <CreatePodCard owned={allowance.owned} limit={allowance.limit} />
          </div>
        </section>

        {joined.length > 0 && (
          <section>
            <h2 className="mb-2.5 px-1 text-body-sm font-bold text-ink lg:text-title">Pods you&apos;ve joined</h2>
            <div className="flex flex-col gap-3">
              {joined.map((pod) => (
                <PodListCard key={pod.id} pod={pod} dependable={dependable.get(pod.id)} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
