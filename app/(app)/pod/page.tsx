import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getNetworkSummary, getPodList } from "@/lib/pod-data";
import { getPodAllowance } from "@/lib/pod-access";
import { getDependableForPods } from "@/lib/pod-dependable";
import { getReceivedInvitations } from "@/lib/pod-invitations";
import { POD_READY_THRESHOLD } from "@/components/dashboard/PodReadyCard";
import { AppHeader } from "@/components/layout/AppHeader";
import { PodListCard } from "@/components/pod/PodListCard";
import { CreatePodCard } from "@/components/pod/CreatePodCard";
import { PodInvitations } from "@/components/pod/PodInvitations";
import { GardenStripLoader } from "@/components/garden/GardenStripLoader";

export default async function PodsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardingComplete) redirect("/onboarding");

  const [pods, allowance, invitations, summary] = await Promise.all([
    getPodList(user.id),
    getPodAllowance(user.id),
    getReceivedInvitations({ id: user.id, email: user.email }),
    getNetworkSummary(user.id),
  ]);

  const dependable = await getDependableForPods(pods.map((p) => p.id));
  // Pods still being built come first, since they're the ones that need something from you.
  const byNeed = (a: (typeof pods)[number], b: (typeof pods)[number]) =>
    Number(a.readyCount >= POD_READY_THRESHOLD) - Number(b.readyCount >= POD_READY_THRESHOLD);
  const owned = pods.filter((p) => p.role === "owner").sort(byNeed);
  const joined = pods.filter((p) => p.role === "member").sort(byNeed);

  return (
    <div>
      <AppHeader wide title="Pods" subtitle="The circles you look out for, and the ones you're part of." />

      <div className="flex flex-col gap-5 px-3.5 pb-8 pt-4 lg:max-w-2xl lg:gap-6 lg:px-0 lg:pt-0">
        <PodInvitations invitations={invitations} />

        {summary.pods > 0 && (
          <div className="flex items-center justify-between gap-3 rounded-3xl bg-panel px-4 py-3.5 text-white lg:rounded-2xl">
            <div>
              <p className="text-label font-bold uppercase tracking-[1.5px] text-white/60">Your network</p>
              <p className="mt-0.5 text-body-sm font-bold">
                {summary.ready} {summary.ready === 1 ? "person" : "people"} ready to donate
              </p>
            </div>
            <p className="shrink-0 text-right text-caption text-white/70">
              {summary.people} {summary.people === 1 ? "person" : "people"}
              <br />
              in {summary.pods} Pod{summary.pods === 1 ? "" : "s"}
            </p>
          </div>
        )}

        {summary.pods > 0 && <GardenStripLoader userId={user.id} />}

        <section>
          <h2 className="mb-2.5 px-1 text-body-sm font-bold text-ink lg:text-title">Your Pod</h2>
          <div className="flex flex-col gap-3">
            {owned.map((pod) => (
              <PodListCard key={pod.id} pod={pod} dependable={dependable.get(pod.id)} />
            ))}
            <CreatePodCard
              owned={allowance.owned}
              limit={allowance.limit}
              firstName={user.name?.split(" ")[0] ?? null}
            />
          </div>
        </section>

        {joined.length > 0 && (
          <section>
            <h2 className="mb-2.5 px-1 text-body-sm font-bold text-ink lg:text-title">Pods you&apos;ve joined</h2>
            <div className="flex flex-col gap-3">
              {joined.map((pod) => (
                <PodListCard key={pod.id} pod={pod} dependable={dependable.get(pod.id)} showRole />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
