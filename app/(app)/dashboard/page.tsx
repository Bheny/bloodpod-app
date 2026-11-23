import { redirect } from "next/navigation";
import Link from "next/link";
import { Droplet, Search } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getDashboardData } from "@/lib/dashboard-data";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { EmergencySlot } from "@/components/dashboard/EmergencySlot";
import { ReadinessCard } from "@/components/dashboard/ReadinessCard";
import { GetStartedCard } from "@/components/get-started/GetStartedCard";
import { getGetStartedState } from "@/lib/get-started-data";
import { PassportMini } from "@/components/dashboard/PassportMini";
import { PodCarousel } from "@/components/dashboard/PodCarousel";
import { getNetworkSummary, getPodList } from "@/lib/pod-data";
import { getPodAllowance } from "@/lib/pod-access";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { SendAlertButton } from "@/components/dashboard/SendAlertButton";
import { HomeHeader } from "@/components/dashboard/home/HomeHeader";
import { HomeHero } from "@/components/dashboard/home/HomeHero";
import { ActionTile, BloodCardTile, NetworkTile, NextDonationTile } from "@/components/dashboard/home/HomeTiles";
import { AvailabilityTile } from "@/components/dashboard/home/AvailabilityTile";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { LogoMark } from "@/components/ui/Logo";
import { isAdminEmail } from "@/lib/admin/auth";
import { getReceivedInvitations } from "@/lib/pod-invitations";
import { PodInvitations } from "@/components/pod/PodInvitations";
import { CareAsksBanner } from "@/components/care/CareAsksBanner";
import { countCareAsksWaiting } from "@/lib/care";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user.hospitalId) redirect("/hospital");
  if (user.labId) redirect("/lab");
  if (!user.onboardingComplete) redirect("/onboarding");

  const [data, invitations, pods, allowance, network, careWaiting, getStarted] = await Promise.all([
    getDashboardData(user.id),
    getReceivedInvitations({ id: user.id, email: user.email }),
    getPodList(user.id),
    getPodAllowance(user.id),
    getNetworkSummary(user.id),
    countCareAsksWaiting(user.id),
    getGetStartedState(user),
  ]);
  if (!data) redirect("/sign-in");

  const showGetStarted = !getStarted.dismissed && !getStarted.allDone;
  const isAdmin = isAdminEmail(user.email);
  const firstName = data.user.name?.split(" ")[0] ?? null;

  return (
    <div>
      {/* Phones: one big card, then small tiles. Everything else waits further down. */}
      <div className="lg:hidden">
        <HomeHeader name={data.user.name} hasEmergency={data.emergencies.length > 0} isAdmin={isAdmin} />

        <div className="flex flex-col gap-3.5 px-3.5 pb-28 pt-3">
          <HomeHero initialEmergencies={data.emergencies} pods={pods} allowance={allowance} firstName={firstName} />

          {invitations.length > 0 && <PodInvitations invitations={invitations} />}
          <CareAsksBanner waiting={careWaiting} />

          <div className="grid grid-cols-2 gap-3">
            <BloodCardTile bloodType={data.user.bloodType} verified={data.passport?.verificationStatus === "VERIFIED"} podCount={data.user.podCount} />
            <NextDonationTile
              isEligible={data.user.isEligible}
              nextEligible={data.user.nextEligible}
              lastDonated={data.passport?.lastDonated ?? null}
            />
            <AvailabilityTile
              isEligible={data.user.isEligible}
              initiallyAvailable={data.user.isAvailable}
              hasPush={data.user.hasPush}
            />
            <NetworkTile people={network.people} pods={network.pods} ready={network.ready} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ActionTile href="/passport/log" label="Log a donation" icon={Droplet} />
            <ActionTile href="/discover" label="Find donors" icon={Search} />
          </div>

          {showGetStarted && <GetStartedCard state={getStarted} />}

          <div className="empty:hidden">
            <InstallPrompt />
          </div>

          <ActivityFeed
            activities={data.recentActivity}
            showPodName={(data.pod ? 1 : 0) + data.user.podsJoined > 1}
          />

          <p className="pt-1 text-center text-caption text-ink-muted">You only hear about matches near you.</p>
        </div>

        <SendAlertButton variant="fab" />
      </div>

      {/* Desktop keeps the original layout. */}
      <div className="hidden lg:block">
        <DashboardHeader
          name={data.user.name}
          bloodType={data.user.bloodType}
          city={data.user.city}
          hasEmergency={data.emergencies.length > 0}
          isAdmin={isAdmin}
        />

        <div className="grid grid-cols-[minmax(0,1fr)_360px] items-start gap-6 pb-8">
          <div className="flex flex-col gap-6">
            <EmergencySlot initial={data.emergencies} bloodType={data.user.bloodType} />

            {invitations.length > 0 && <PodInvitations invitations={invitations} />}
            <CareAsksBanner waiting={careWaiting} />

            <div className={showGetStarted ? "grid grid-cols-2 gap-6" : undefined}>
              <ReadinessCard
                isEligible={data.user.isEligible}
                nextEligible={data.user.nextEligible ? new Date(data.user.nextEligible).toISOString() : null}
                initiallyAvailable={data.user.isAvailable}
                hasPush={data.user.hasPush}
                verified={data.passport?.verificationStatus === "VERIFIED"}
              />
              {showGetStarted && <GetStartedCard state={getStarted} />}
            </div>

            <ActivityFeed
              activities={data.recentActivity}
              showPodName={(data.pod ? 1 : 0) + data.user.podsJoined > 1}
            />
          </div>

          <div className="sticky top-8 flex flex-col gap-6">
            <PassportMini
              name={data.user.name}
              city={data.user.city}
              bloodType={data.user.bloodType}
              donationCount={data.passport?.donationCount ?? 0}
              podCount={data.user.podCount}
              isEligible={data.passport?.isEligible ?? true}
              nextEligible={data.passport?.nextEligible ?? null}
              verificationStatus={data.passport?.verificationStatus ?? "UNVERIFIED"}
            />

            {pods.length > 0 ? (
              <PodCarousel pods={pods} allowance={allowance} firstName={firstName} />
            ) : (
              <div className="rounded-2xl bg-card p-6 text-center shadow-raised">
                <LogoMark className="mx-auto size-10 opacity-30" />
                <p className="mt-3 text-sm font-bold text-ink">You have no Pod yet.</p>
                <p className="mt-1 text-xs text-ink-muted">Invite people you trust to build your blood network.</p>
                <Link href="/pod/invite" className="mt-3 inline-block rounded-full bg-red px-5 py-2 text-xs font-bold text-white">
                  Create your Pod
                </Link>
              </div>
            )}

            <QuickActions />

            <SendAlertButton variant="block" className="flex" />
          </div>
        </div>
      </div>
    </div>
  );
}
