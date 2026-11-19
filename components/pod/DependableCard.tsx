import { Lightbulb } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import type { DependableResult } from "@/lib/pod-dependable";

function Ring({ score }: { score: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-24 shrink-0">
      <svg viewBox="0 0 80 80" className="size-full -rotate-90" aria-hidden>
        <circle cx="40" cy="40" r={r} fill="none" strokeWidth="8" className="stroke-surface" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
          className="stroke-red"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-title font-bold leading-none text-ink">{score}%</span>
      </div>
    </div>
  );
}

export function DependableCard({
  result,
  showTip,
}: {
  result: DependableResult;
  /** Only the owner can act on the tip. */
  showTip: boolean;
}) {
  return (
    <Card>
      <CardTitle>Dependable</CardTitle>

      <div className="mt-3 flex items-center gap-4">
        <Ring score={result.score} />
        <div className="min-w-0">
          <p className="text-body-sm font-bold text-ink lg:text-title">{result.label}</p>
          <p className="mt-0.5 text-caption text-ink-muted lg:text-body-sm">
            How much this Pod can be relied on, from the people in it.
          </p>
        </div>
      </div>

      <ul className="mt-4 flex flex-col gap-3">
        {result.parts.map((part) => (
          <li key={part.id}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-caption font-bold text-ink lg:text-body-sm">{part.label}</span>
              <span className="text-caption text-ink-muted">{part.value === null ? "Building" : `${part.value}%`}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full bg-red"
                style={{ width: `${part.value ?? 0}%`, opacity: part.value === null ? 0.3 : 1 }}
              />
            </div>
            <p className="mt-1 text-label text-ink-muted">{part.detail}</p>
          </li>
        ))}
      </ul>

      {showTip && result.tip && (
        <div className="mt-4 flex gap-2.5 rounded-xl bg-red-light p-3">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-red-fg" />
          <p className="text-caption text-ink lg:text-body-sm">{result.tip}</p>
        </div>
      )}
    </Card>
  );
}

/** Small version for the Pods list. */
export function DependableChip({ result }: { result: DependableResult }) {
  return (
    <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 text-label font-bold text-ink-mid">
      {result.score}% dependable
    </span>
  );
}
