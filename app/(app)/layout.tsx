import { BottomNav } from "@/components/layout/BottomNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { AppFrame } from "@/components/layout/AppFrame";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { BLOOD_TYPE_LABELS } from "@/lib/blood-type";
import { isAdminEmail } from "@/lib/admin/auth";
import { Suspense } from "react";
import { SpotlightTour } from "@/components/tour/SpotlightTour";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const pushCount = user ? await prisma.pushSubscription.count({ where: { userId: user.id } }) : 0;
  // New members get the tour once, on Home. It can be replayed from Get started.
  const tourPending = Boolean(user && user.onboardingComplete && !user.tourSeenAt && !user.hospitalId && !user.labId);

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar
        isAdmin={isAdminEmail(user?.email)}
        user={
          user
            ? {
                name: user.name,
                bloodType: user.bloodType ? BLOOD_TYPE_LABELS[user.bloodType] : null,
                hasPush: pushCount > 0,
              }
            : null
        }
      />
      <AppFrame>{children}</AppFrame>
      <BottomNav />
      <Suspense>
        <SpotlightTour pending={tourPending} />
      </Suspense>
    </div>
  );
}
