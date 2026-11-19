import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getDashboardData } from "@/lib/dashboard-data";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { EmergencySlot } from "@/components/dashboard/EmergencySlot";
import { ReadinessCard } from "@/components/dashboard/ReadinessCard";
import { NextSteps, hasOpenNextSteps } from "@/components/dashboard/NextSteps";
import { PassportMini } from "@/components/dashboard/PassportMini";
import { PodReadyCard } from "@/components/dashboard/PodReadyCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { SendAlertButton } from "@/components/dashboard/SendAlertButton";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { LogoMark } from "@/components/ui/Logo";
import { isAdminEmail } from "@/lib/admin/auth";
import { getReceivedInvitations } from "@/lib/pod-invitations";
import { PodInvitations } from "@/components/pod/PodInvitations";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user.hospitalId) redirect("/hospital");
  if (user.labId) redirect("/lab");
  if (!user.onboardingComplete) redirect("/onboarding");

  const [data, invitations] = await Promise.all([
    getDashboardData(user.id),
    getReceivedInvitations({ id: user.id, email: user.email }),
  ]);
  if (!data) redirect("/sign-in");

  const memberCount = data.pod?.memberCount ?? 1;
  const showNextSteps = hasOpenNextSteps({ hasPush: data.user.hasPush, memberCount });

  // On phones every card sits in one column, in the order below (the `order-*`
  // classes). From `lg` up the two wrappers become the main column and a
  // sticky side rail.
  return (
    <div>
      <DashboardHeader
        name={data.user.name}
        bloodType={data.user.bloodType}
        city={data.user.city}
        hasEmergency={data.emergencies.length > 0}
        isAdmin={isAdminEmail(user.email)}
      />

      <div className="flex flex-col gap-3.5 px-3.5 pb-28 pt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-6 lg:px-0 lg:pb-8 lg:pt-0">
        <div className="contents lg:flex lg:flex-col lg:gap-6">
          <div className="order-1 lg:order-none">
            <EmergencySlot initial={data.emergencies} bloodType={data.user.bloodType} />
          </div>

          {invitations.length > 0 && (
            <div className="order-1 lg:order-none">
              <PodInvitations invitations={invitations} />
            </div>
          )}

          <div
            className={
              showNextSteps
                ? "order-2 grid gap-3.5 lg:order-none lg:grid-cols-2 lg:gap-6"
                : "order-2 lg:order-none"
            }
          >
            <ReadinessCard
              isEligible={data.user.isEligible}
              nextEligible={data.user.nextEligible ? new Date(data.user.nextEligible).toISOString() : null}
              initiallyAvailable={data.user.isAvailable}
              hasPush={data.user.hasPush}
              verified={data.passport?.verificationStatus === "VERIFIED"}
            />
            {showNextSteps && <NextSteps hasPush={data.user.hasPush} memberCount={memberCount} />}
          </div>

          <div className="order-3 empty:hidden lg:order-none">
            <InstallPrompt />
          </div>

          <div className="order-7 lg:order-none">
            <ActivityFeed
              activities={data.recentActivity}
              showPodName={(data.pod ? 1 : 0) + data.user.podsJoined > 1}
            />
          </div>
        </div>

        <div className="contents lg:sticky lg:top-8 lg:flex lg:flex-col lg:gap-6">
          <div className="order-4 lg:order-none">
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
          </div>

          <div className="order-5 lg:order-none">
            {data.pod ? (
              <PodReadyCard
                podName={data.pod.name}
                memberCount={data.pod.memberCount}
                readyCount={data.pod.readyCount}
                members={data.pod.members}
              />
            ) : (
              <div className="rounded-2xl bg-white p-6 text-center shadow-raised">
                <LogoMark className="mx-auto size-10 opacity-30" />
                <p className="mt-3 text-sm font-bold text-ink">You have no Pod yet.</p>
                <p className="mt-1 text-xs text-ink-muted">Invite people you trust to build your blood network.</p>
                <Link
                  href="/pod/invite"
                  className="mt-3 inline-block rounded-full bg-red px-5 py-2 text-xs font-bold text-white"
                >
                  Create your Pod
                </Link>
              </div>
            )}
          </div>

          <div className="order-6 lg:order-none">
            <QuickActions />
          </div>

          <SendAlertButton variant="block" className="hidden lg:flex" />
        </div>
      </div>

      <SendAlertButton variant="fab" />
    </div>
  );
}
