import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, Compass } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getGetStartedState } from "@/lib/get-started-data";
import { AppHeader } from "@/components/layout/AppHeader";
import { GetStartedVisibility, StepActions } from "@/components/get-started/StepActions";
import { InfoTip } from "@/components/ui/InfoTip";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function GetStartedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user.hospitalId) redirect("/hospital");
  if (user.labId) redirect("/lab");
  if (!user.onboardingComplete) redirect("/onboarding");

  const state = await getGetStartedState(user);
  const nextId = state.next?.id;

  return (
    <div>
      <AppHeader title="Get started" subtitle="Seven steps to make your Pod ready" backHref="/dashboard" />

      <div className="flex flex-col gap-3 px-3.5 pb-28 pt-4 lg:max-w-xl lg:px-0 lg:pb-8 lg:pt-0">
        <section className="rounded-3xl border-[0.5px] border-hairline bg-card p-4 shadow-raised lg:rounded-2xl lg:p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-body-sm font-bold text-ink">
              {state.allDone ? "You have done every step." : `${state.done} of ${state.total} done`}
            </p>
            <Link href="/dashboard?tour=1" className="inline-flex min-h-8 items-center gap-1.5 text-caption font-bold text-red-fg">
              <Compass className="size-3.5" aria-hidden="true" /> Take the tour
            </Link>
          </div>
          <div
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={state.total}
            aria-valuenow={state.done}
            aria-label="Get started progress"
          >
            <div className="h-full rounded-full bg-red" style={{ width: `${(state.done / state.total) * 100}%` }} />
          </div>
          <p className="mt-3 text-caption leading-relaxed text-ink-muted">
            Go at your own pace, in any order. A step ticks itself once you have done it. Skip anything that is not for you.
          </p>
        </section>

        <ol className="flex flex-col gap-3">
          {state.steps.map((step, i) => {
            const isNext = step.id === nextId;
            return (
              <li
                key={step.id}
                className={cn(
                  "flex gap-3 rounded-3xl border-[0.5px] bg-card p-4 shadow-raised lg:rounded-2xl lg:p-5",
                  isNext ? "border-red-mid ring-1 ring-red/15" : "border-hairline",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-caption font-bold",
                    step.done ? "bg-success-strong text-white" : isNext ? "bg-red text-white" : "bg-surface text-ink-muted",
                  )}
                  aria-hidden="true"
                >
                  {step.done ? <Check className="size-4" strokeWidth={3} /> : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-body-sm font-bold text-ink">
                    <span className={cn(step.done && "text-ink-muted")}>{step.title}</span>
                    {step.tip && <InfoTip term={step.tip} />}
                    {step.skipped && <span className="rounded-full bg-surface px-2 py-0.5 text-label font-bold text-ink-muted">Skipped</span>}
                    <span className="sr-only">{step.done ? "Done" : isNext ? "Up next" : "To do"}</span>
                  </p>
                  {!step.done && <p className="mt-1 text-caption leading-relaxed text-ink-muted">{step.why}</p>}
                  <StepActions step={step} size="sm" />
                </div>
              </li>
            );
          })}
        </ol>

        <div className="flex justify-center pt-1">
          <GetStartedVisibility dismissed={state.dismissed} />
        </div>
      </div>
    </div>
  );
}
