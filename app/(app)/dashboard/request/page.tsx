import Link from "next/link";
import { redirect } from "next/navigation";
import { BloodType } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/admin/auth";
import { previewReach } from "@/lib/alerts";
import { AppHeader } from "@/components/layout/AppHeader";
import { RequestForm } from "@/components/alerts/RequestForm";

export const dynamic = "force-dynamic";

export default async function RequestBloodPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user.hospitalId) redirect("/hospital");
  if (user.labId) redirect("/lab");
  if (!user.onboardingComplete) redirect("/onboarding");

  // One request at a time: someone with one open goes straight to following it.
  const open = await prisma.bloodRequest.findFirst({
    where: { requesterId: user.id, isTest: false, status: "OPEN", OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
    select: { id: true },
  });
  if (open) redirect(`/dashboard/request/${open.id}`);

  const reach: Record<string, number> = {};
  await Promise.all(
    (Object.values(BloodType) as BloodType[]).map(async (t) => {
      reach[t] = (await previewReach(user.id, t)).pod;
    }),
  );

  return (
    <div>
      <AppHeader title="Request blood" subtitle="Alert your Pod when you need blood" backHref="/dashboard" />
      <div className="px-3.5 pb-28 pt-4 lg:max-w-xl lg:px-0 lg:pb-8 lg:pt-0">
        {user.phone ? (
          <RequestForm defaultType={user.bloodType} podReach={reach} canTest={isAdminEmail(user.email)} />
        ) : (
          <div className="rounded-3xl border-[0.5px] border-hairline bg-card p-5 shadow-raised">
            <p className="text-body-sm font-bold text-ink">Add your phone number first</p>
            <p className="mt-1 text-caption leading-relaxed text-ink-muted">
              The people who say they can come need a way to reach you. Your number is shown only to someone who says yes.
            </p>
            <Link href="/profile/edit" className="mt-3 inline-flex min-h-11 items-center rounded-full bg-red px-5 text-body-sm font-bold text-white">
              Add my number
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
