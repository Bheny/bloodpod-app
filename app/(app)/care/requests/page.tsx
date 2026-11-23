import { redirect } from "next/navigation";
import { CalendarDays, Hospital, Users } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getMyCareAsks } from "@/lib/care";
import { daysUntilDate } from "@/lib/care-rules";
import { BLOOD_TYPE_LABELS } from "@/lib/blood-type";
import { formatDate } from "@/lib/formatters";
import { AppHeader } from "@/components/layout/AppHeader";
import { AskAnswer } from "@/components/care/CareActions";

/**
 * What a donor is asked to do. They see the blood group, the date, the hospital and how many donors
 * are needed, never the condition. Answering is free for everyone.
 */
export default async function CareRequestsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardingComplete) redirect("/onboarding");

  const asks = await getMyCareAsks(user.id);

  return (
    <div>
      <AppHeader title="Requests to give" subtitle="People in your Pods who asked for your help on a date" backHref="/dashboard" />

      <div className="flex flex-col gap-3 px-3.5 pb-8 pt-4 lg:max-w-xl lg:px-0 lg:pt-0">
        {asks.length === 0 ? (
          <p className="rounded-3xl border-[0.5px] border-hairline bg-card px-6 py-10 text-center text-body-sm text-ink-muted shadow-raised lg:rounded-2xl">
            Nothing waiting for you. When someone in your Pods asks for help on a date, it shows up here.
          </p>
        ) : (
          asks.map(({ entryId, status, view }) => {
            const days = daysUntilDate(view.scheduledFor);
            return (
              <section key={entryId} className="rounded-3xl border-[0.5px] border-hairline bg-card p-4 shadow-raised lg:rounded-2xl">
                <p className="text-body-sm text-ink-mid">
                  <span className="font-bold text-ink">{view.askedBy ?? "Someone in your Pod"}</span> is asking for your help
                </p>
                <ul className="mt-3 flex flex-col gap-2 text-body-sm text-ink">
                  <li className="flex items-center gap-2.5">
                    <CalendarDays className="size-4 text-ink-faint" aria-hidden />
                    {formatDate(view.scheduledFor)} · {days <= 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`}
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="flex size-4 items-center justify-center text-label font-extrabold text-red-fg">+</span>
                    Blood group {BLOOD_TYPE_LABELS[view.bloodType]}
                  </li>
                  {view.hospital && (
                    <li className="flex items-center gap-2.5">
                      <Hospital className="size-4 text-ink-faint" aria-hidden />
                      {view.hospital}
                    </li>
                  )}
                  <li className="flex items-center gap-2.5">
                    <Users className="size-4 text-ink-faint" aria-hidden />
                    {view.donorsNeeded} {view.donorsNeeded === 1 ? "donor" : "donors"} needed
                  </li>
                </ul>
                <p className="mt-3 text-caption text-ink-muted">Your name and phone number reach them only if you say Yes.</p>
                <AskAnswer entryId={entryId} status={status === "YES" ? "YES" : "REQUESTED"} />
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
