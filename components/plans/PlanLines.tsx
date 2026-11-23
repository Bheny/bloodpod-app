import { Check, CircleDashed } from "lucide-react";
import type { PlanLine } from "@/lib/plan-catalog";
import { InfoTip } from "@/components/ui/InfoTip";

/** What works today comes first and reads in full strength; what is promised sits below, quieter, and says so. */
export function PlanLines({ lines }: { lines: PlanLine[] }) {
  const live = lines.filter((l) => !l.soon);
  const soon = lines.filter((l) => l.soon);
  return (
    <div className="mt-6 flex flex-1 flex-col gap-5">
      {live.length > 0 && (
        <ul className="flex flex-col gap-3">
          {live.map((l) => (
            <li key={l.text} className="flex items-start gap-3 text-sm leading-snug text-ink">
              <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full bg-success-soft">
                <Check className="size-3 text-success-strong" strokeWidth={3} aria-hidden="true" />
              </span>
              {l.text}
            </li>
          ))}
        </ul>
      )}
      {soon.length > 0 && (
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[1.5px] text-ink-faint">
            Coming soon <InfoTip term="soon" />
          </p>
          <ul className="mt-3 flex flex-col gap-3">
            {soon.map((l) => (
              <li key={l.text} className="flex items-start gap-3 text-sm leading-snug text-ink-muted">
                <CircleDashed className="mt-px size-5 shrink-0 text-ink-faint" aria-hidden="true" />
                {l.text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
