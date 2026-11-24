import { Badge } from "@/components/admin/ui";
import type { StrengthView } from "@/lib/admin/pod-strength";

/** One donor's Pod progress for the Users list: a word, a small bar, and the count behind it. */
export function PodStrengthCell({ s }: { s: StrengthView }) {
  if (s.key === "none" || s.key === "member") {
    return (
      <span>
        <Badge>{s.label}</Badge>
      </span>
    );
  }
  const goal = s.target ?? Math.max(s.ready, 1);
  const pct = Math.min(100, Math.round((s.ready / goal) * 100));
  const bar = s.key === "complete" ? "bg-[#1FA855]" : s.key === "ready" || s.key === "strong" ? "bg-info-strong" : "bg-red";
  return (
    <span className="block min-w-0">
      <span className="flex items-center gap-2">
        <Badge tone={s.tone}>{s.label}</Badge>
        {s.pods > 1 && <span className="text-label text-ink-muted">{s.pods} Pods</span>}
      </span>
      <span
        className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-surface"
        role="progressbar"
        aria-label="Pod progress"
        aria-valuemin={0}
        aria-valuemax={goal}
        aria-valuenow={Math.min(s.ready, goal)}
      >
        <span className={`block h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
      </span>
      <span className="mt-1 block truncate text-label text-ink-muted">
        {s.ready} of {s.size} ready{s.target ? ` · next at ${s.target}` : ""}
      </span>
    </span>
  );
}
