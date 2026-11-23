import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { getDonorView } from "@/lib/alerts";
import { AppHeader } from "@/components/layout/AppHeader";
import { AnswerPanel } from "@/components/alerts/AnswerPanel";

export const dynamic = "force-dynamic";

/** Where a push notification lands: the request, and the two answers. */
export default async function AlertPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const { id } = await params;

  // The person who asked follows their own request instead.
  const own = await prisma.bloodRequest.findUnique({ where: { id }, select: { requesterId: true } });
  if (own?.requesterId === user.id) redirect(`/dashboard/request/${id}`);

  const view = await getDonorView(user.id, id);
  if (!view) notFound();

  return (
    <div>
      <AppHeader title="Blood needed" subtitle="Can you come?" backHref="/dashboard" />
      <div className="px-3.5 pb-28 pt-4 lg:max-w-xl lg:px-0 lg:pb-8 lg:pt-0">
        <AnswerPanel view={view} />
      </div>
    </div>
  );
}
