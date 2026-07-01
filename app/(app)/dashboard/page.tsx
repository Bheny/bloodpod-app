import { redirect } from "next/navigation";
import Link from "next/link";
import { Bell } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getDashboardData } from "@/lib/dashboard-data";
import { getInitials } from "@/lib/formatters";
import { PodStrengthMeter } from "@/components/pod/PodStrengthMeter";
import { recalculatePodStrength } from "@/lib/pod-strength";
import { AlertBar } from "@/components/dashboard/AlertBar";
import { PassportMini } from "@/components/dashboard/PassportMini";
import { PodSummaryCard } from "@/components/dashboard/PodSummaryCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { LogoMark } from "@/components/ui/Logo";
import { PodStrengthCelebrationWatcher } from "@/components/celebration/PodStrengthCelebrationWatcher";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardingComplete) redirect("/onboarding");

  const [data, strength] = await Promise.all([
    getDashboardData(user.id),
    recalculatePodStrength(user.id),
  ]);

  if (!data) redirect("/sign-in");

  const firstName = data.user.name?.split(" ")[0] ?? "there";
  const topRequest = data.openRequests[0];

  return (
    <div>
      <PodStrengthCelebrationWatcher userId={user.id} steps={strength.steps} />

      <div className="flex items-center justify-between border-b-[0.5px] border-hairline bg-white px-[18px] py-3.5 lg:px-6 lg:py-5">
        <div>
          <p className="text-[19px] font-extrabold leading-[1.1] tracking-[-0.7px] text-ink lg:text-[26px]">
            {greeting()}, {firstName}.
          </p>
          <p className="text-label font-medium text-ink-muted lg:text-body-sm">
            {data.user.bloodType ?? "No blood type"} · {data.user.city ?? "No city set"} ·{" "}
            {data.user.isEligible ? "eligible" : "not yet eligible"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Notifications"
            className="flex size-[38px] items-center justify-center rounded-full bg-surface lg:size-11"
          >
            <Bell className="size-[18px] text-ink-mid lg:size-5" />
          </button>
          <span className="flex size-[38px] items-center justify-center rounded-full bg-red text-sm font-bold text-white lg:size-11 lg:text-base">
            {data.user.name ? getInitials(data.user.name) : "?"}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3.5 px-3.5 py-4 lg:gap-5 lg:px-6 lg:py-6">
        {topRequest && <AlertBar request={topRequest} />}

        {strength.score < 100 && (
          <PodStrengthMeter
            score={strength.score}
            steps={strength.steps}
            podName={strength.podName ?? "Your pod"}
          />
        )}

        <PassportMini
          name={data.user.name}
          city={data.user.city}
          bloodType={data.user.bloodType}
          donationCount={data.passport?.donationCount ?? 0}
          podCount={data.user.podsJoined}
          isEligible={data.passport?.isEligible ?? true}
          nextEligible={data.passport?.nextEligible ?? null}
          verificationStatus={data.passport?.verificationStatus ?? "UNVERIFIED"}
        />

        {data.pod ? (
          <PodSummaryCard
            podName={data.pod.name}
            podSlug={data.pod.slug}
            memberCount={data.pod.memberCount}
            members={data.pod.members}
            plan={data.user.plan}
          />
        ) : (
          <div className="rounded-2xl bg-white p-6 text-center lg:p-10">
            <LogoMark className="mx-auto size-10 opacity-30 lg:size-12" />
            <p className="mt-3 text-sm font-bold text-ink lg:text-base">Your pod is empty.</p>
            <p className="mt-1 text-xs text-ink-muted lg:text-sm">
              Invite people you trust to build your blood network.
            </p>
            <Link
              href="/pod/invite"
              className="mt-3 inline-block rounded-full bg-red px-5 py-2 text-xs font-bold text-white lg:px-6 lg:py-2.5 lg:text-sm"
            >
              Create your pod
            </Link>
          </div>
        )}

        <QuickActions />
        <ActivityFeed
          activities={data.recentActivity}
          showPodName={(data.pod ? 1 : 0) + data.user.podsJoined > 1}
        />
      </div>
    </div>
  );
}
