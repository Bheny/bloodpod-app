import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isCaptainEnabled } from "@/lib/captain/flag";
import { drillClosesAt, isDrillOpen } from "@/lib/captain/drill";
import { finishDrill } from "@/lib/captain/finish";
import { CAPTAIN } from "@/lib/captain-config";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card } from "@/components/ui/Card";
import { AutoRefresh, DrillResponder } from "@/components/captain/CaptainActions";

export const dynamic = "force-dynamic";

export default async function DrillPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isCaptainEnabled())) notFound();
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  // If the window is over this closes it, once, and brings the Pod's level up to date.
  await finishDrill(id);
  const drill = await prisma.drill.findUnique({
    where: { id },
    include: {
      pod: { select: { id: true, name: true, ownerId: true, members: { select: { userId: true } } } },
      responses: { where: { userId: user.id }, select: { secondsToRespond: true } },
    },
  });
  if (!drill) notFound();

  const isLeader = drill.pod.ownerId === user.id;
  if (!isLeader && !drill.pod.members.some((m) => m.userId === user.id)) notFound();

  const open = isDrillOpen(drill);
  const answered = drill.responses[0];

  return (
    <div>
      <AppHeader wide backHref={isLeader ? "/captain" : "/pod"} title="Drill" subtitle={drill.pod.name} />

      <div className="flex max-w-xl flex-col gap-3.5 px-3.5 pb-28 pt-4 lg:px-0 lg:pb-8 lg:pt-0">
        {open && <AutoRefresh />}

        {!isLeader && (
          <Card>
            {answered ? (
              <div className="text-center">
                <CheckCircle2 className="mx-auto size-10 text-success-strong" aria-hidden />
                <p className="mt-3 text-title font-extrabold text-ink">Thank you, you are here</p>
                <p className="mt-1 text-caption text-ink-muted">You answered in {answered.secondsToRespond} seconds.</p>
              </div>
            ) : open ? (
              <DrillResponder drillId={drill.id} podName={drill.pod.name} />
            ) : (
              <p className="text-center text-body-sm text-ink-mid">This drill has ended. Thank you for being ready.</p>
            )}
          </Card>
        )}

        {isLeader && (
          <Card>
            {open ? (
              <div className="text-center">
                <Clock className="mx-auto size-9 text-ink-muted" aria-hidden />
                <p className="mt-3 text-title font-extrabold text-ink">Your Pod is answering</p>
                <p className="mt-1 text-caption text-ink-muted">
                  {drill.respondedCount} of {drill.eligibleCount} are here so far. The drill closes at{" "}
                  {drillClosesAt(drill).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}.
                </p>
              </div>
            ) : drill.passed ? (
              <div className="text-center">
                <CheckCircle2 className="mx-auto size-10 text-success-strong" aria-hidden />
                <p className="mt-3 text-title font-extrabold text-ink">Drill passed</p>
                <p className="mt-1 text-body-sm text-ink-mid">
                  {drill.respondedCount} of {drill.eligibleCount} answered within {drill.windowMinutes} minutes. Your Pod is ready.
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-title font-extrabold text-ink">Not yet</p>
                <p className="mt-1 text-body-sm text-ink-mid">
                  {drill.respondedCount} of {drill.eligibleCount} answered within {drill.windowMinutes} minutes. A drill passes at {Math.round(CAPTAIN.drillPassRate * 100)}%.
                </p>
                <p className="mt-2 text-caption text-ink-muted">
                  It helps to tell your Pod before you run one. You can try again in a week.
                </p>
              </div>
            )}
            <Link href="/captain" className="mt-4 flex min-h-11 items-center justify-center rounded-full bg-surface px-5 text-body-sm font-bold text-ink">
              Back to Captain
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
