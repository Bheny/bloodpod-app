import { Check, Minus } from "lucide-react";
import { COMPARISON } from "@/lib/plan-catalog";
import { cn } from "@/lib/utils";

function Cell({ value, strong }: { value: string; strong?: boolean }) {
  if (value === "Yes") {
    return (
      <span className="inline-flex size-6 items-center justify-center rounded-full bg-success-soft" role="img" aria-label="Yes">
        <Check className="size-3.5 text-success-strong" strokeWidth={3} aria-hidden="true" />
      </span>
    );
  }
  if (value === "No") {
    return (
      <span role="img" aria-label="No">
        <Minus className="mx-auto size-4 text-ink-faint" aria-hidden="true" />
      </span>
    );
  }
  return <span className={cn("text-sm leading-snug", strong ? "font-bold text-ink" : "text-ink-mid")}>{value}</span>;
}

/** Free next to Plus, one row per feature. Server-rendered, no script. */
export function ComparisonTable({ className }: { className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-3xl border border-hairline bg-card shadow-raised", className)}>
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">What Free and Plus include</caption>
        <thead>
          <tr className="bg-surface">
            <th scope="col" className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-[1.5px] text-ink-muted lg:px-6">
              Feature
            </th>
            <th scope="col" className="w-[26%] px-2 py-3.5 text-center text-sm font-extrabold text-ink lg:w-[22%]">
              Free
            </th>
            <th scope="col" className="w-[26%] px-2 py-3.5 text-center text-sm font-extrabold text-red-fg lg:w-[22%]">
              Plus
            </th>
          </tr>
        </thead>
        <tbody>
          {COMPARISON.map((row) => (
            <tr key={row.feature} className="border-t-[0.5px] border-hairline">
              <th scope="row" className="px-4 py-3.5 text-sm font-semibold leading-snug text-ink lg:px-6">
                {row.feature}
                {row.soon && (
                  <span className="ml-2 inline-block rounded-full bg-surface px-2 py-0.5 align-middle text-[10px] font-bold uppercase tracking-[1px] text-ink-muted">
                    Soon
                  </span>
                )}
              </th>
              <td className="px-2 py-3.5 text-center">
                <Cell value={row.free} />
              </td>
              <td className="bg-red-light/40 px-2 py-3.5 text-center">
                <Cell value={row.plus} strong />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
