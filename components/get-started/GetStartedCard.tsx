import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { GetStartedVisibility, StepActions } from "@/components/get-started/StepActions";
import { InfoTip } from "@/components/ui/InfoTip";
import type { GetStartedState } from "@/lib/get-started-data";

/** On Home: how far along they are, and the one thing to do next. The whole list is on /get-started. */
export function GetStartedCard({ state }: { state: GetStartedState }) {
  const { next, done, total } = state;
  if (!next) return null;

  return (
    <section
      data-tour="get-started"
      aria-labelledby="get-started-title"
      className="rounded-3xl border-[0.5px] border-hairline bg-card p-4 shadow-raised lg:rounded-2xl lg:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="get-started-title" className="text-body-sm font-bold text-ink lg:text-title">
          Get started
        </h2>
        <span className="rounded-full bg-surface px-2.5 py-0.5 text-label font-bold text-ink-mid">
          {done} of {total}
        </span>
      </div>

      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-label="Get started progress"
      >
        <div className="h-full rounded-full bg-red transition-all duration-500" style={{ width: `${(done / total) * 100}%` }} />
      </div>

      <p className="mt-4 text-label font-bold uppercase tracking-[1.5px] text-red-fg">Next</p>
      <p className="mt-1 flex items-center gap-1.5 text-body-sm font-bold text-ink lg:text-body">
        {next.title}
        {next.tip && <InfoTip term={next.tip} />}
      </p>
      <p className="mt-1 text-caption leading-relaxed text-ink-muted lg:text-body-sm">{next.why}</p>

      <StepActions step={next} />

      <div className="mt-4 flex items-center justify-between gap-3 border-t-[0.5px] border-hairline pt-3">
        <Link href="/get-started" className="inline-flex min-h-8 items-center gap-0.5 text-caption font-bold text-red-fg">
          See all steps <ChevronRight className="size-3.5" aria-hidden="true" />
        </Link>
        <GetStartedVisibility dismissed={false} />
      </div>
    </section>
  );
}
