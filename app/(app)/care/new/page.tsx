import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { userCan } from "@/lib/care";
import { AppHeader } from "@/components/layout/AppHeader";
import { CareSetup } from "@/components/care/CareSetup";

export default async function NewCarePodPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user.hospitalId) redirect("/hospital");
  if (user.labId) redirect("/lab");
  if (!user.onboardingComplete) redirect("/onboarding");
  // The plan is read from the database. No plan, no setup: the upgrade page explains it.
  if (!(await userCan(user.id, "care_dashboard"))) redirect("/upgrade");

  const pods = await prisma.pod.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, _count: { select: { members: true } } },
  });

  return (
    <div>
      <AppHeader title="New Care Pod" subtitle="Plan ahead for someone who needs blood again and again" backHref="/care" />
      <CareSetup pods={pods.map((p) => ({ id: p.id, name: p.name, members: p._count.members }))} />
    </div>
  );
}
