import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export function PageTitle({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[26px] font-extrabold leading-tight tracking-[-0.8px] text-ink lg:text-[30px]">{title}</h1>
        {subtitle && <p className="mt-1 text-body-sm text-ink-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/** A change versus the previous period. `null` means there was nothing to compare with. */
export function Delta({ value, goodWhenUp = true }: { value: number | null; goodWhenUp?: boolean }) {
  if (value === null) return <span className="text-caption text-ink-muted">new</span>;
  if (value === 0)
    return (
      <span className="inline-flex items-center gap-0.5 text-caption font-semibold text-ink-muted">
        <Minus className="size-3" /> 0%
      </span>
    );
  const up = value > 0;
  const good = up === goodWhenUp;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-caption font-bold", good ? "text-[#1FA855]" : "text-red")}>
      <Icon className="size-3.5" />
      {Math.abs(value)}%
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  delta,
  href,
  tone,
}: {
  label: string;
  value: string | number;
  hint?: string;
  delta?: React.ReactNode;
  href?: string;
  tone?: "default" | "good" | "warn";
}) {
  const body = (
    <Card
      className={cn(
        "h-full p-4 lg:p-5",
        href && "transition-colors hover:border-red-mid",
        tone === "warn" && "border-red-mid bg-red-light/40",
      )}
    >
      <p className="text-caption font-semibold text-ink-muted">{label}</p>
      <p
        className={cn(
          "mt-1.5 text-[28px] font-extrabold leading-none tracking-[-1px]",
          tone === "good" ? "text-[#1FA855]" : tone === "warn" ? "text-red" : "text-ink",
        )}
      >
        {value}
      </p>
      {(hint || delta) && (
        <p className="mt-2 flex items-center gap-2 text-caption text-ink-muted">
          {delta}
          {hint}
        </p>
      )}
    </Card>
  );
  return href ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}

export function Panel({
  title,
  subtitle,
  actions,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-body-sm font-bold text-ink lg:text-title">{title}</h2>
          {subtitle && <p className="mt-0.5 text-caption text-ink-muted">{subtitle}</p>}
        </div>
        {actions}
      </div>
      <div className="mt-4">{children}</div>
    </Card>
  );
}

const BADGE_TONES = {
  gray: "bg-surface text-ink-mid",
  green: "bg-[#F0FBF3] text-[#166534]",
  red: "bg-red-light text-red",
  amber: "bg-[#FFF7E6] text-[#9A6700]",
  blue: "bg-[#EFF6FF] text-[#1D4ED8]",
} as const;

export function Badge({ tone = "gray", children }: { tone?: keyof typeof BADGE_TONES; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-caption font-bold", BADGE_TONES[tone])}>
      {children}
    </span>
  );
}

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-hairline px-4 py-8 text-center">
      <p className="text-body-sm font-bold text-ink">{title}</p>
      {body && <p className="mx-auto mt-1 max-w-sm text-caption text-ink-muted">{body}</p>}
    </div>
  );
}

/** Horizontal bars for distributions: label, bar, number. */
export function HBars({
  rows,
  color = "#DD0000",
  formatValue = (n: number) => String(n),
}: {
  rows: { label: string; value: number; sub?: string }[];
  color?: string;
  formatValue?: (n: number) => string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex items-baseline justify-between gap-3 text-caption">
            <span className="truncate font-semibold text-ink">{r.label}</span>
            <span className="shrink-0 tabular-nums text-ink-muted">
              {formatValue(r.value)}
              {r.sub ? <span className="ml-1.5 text-ink-faint">{r.sub}</span> : null}
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface">
            <div className="h-full rounded-full" style={{ width: `${(r.value / max) * 100}%`, backgroundColor: color }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Funnel: each step shows its count, share of the first step, and the drop from the one before. */
export function Funnel({
  steps,
}: {
  steps: { key: string; label: string; value: number; ofFirst: number; ofPrev: number }[];
}) {
  return (
    <ol className="space-y-3">
      {steps.map((s, i) => (
        <li key={s.key}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-body-sm font-semibold text-ink">{s.label}</span>
            <span className="text-body-sm tabular-nums">
              <span className="font-extrabold text-ink">{s.value}</span>
              <span className="ml-2 text-caption text-ink-muted">{s.ofFirst}%</span>
            </span>
          </div>
          <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-surface">
            <div className="h-full rounded-full bg-red" style={{ width: `${Math.max(s.ofFirst, s.value > 0 ? 2 : 0)}%` }} />
          </div>
          {i > 0 && s.ofPrev < 100 && (
            <p className="mt-1 text-caption text-ink-muted">{100 - s.ofPrev}% drop from the step above</p>
          )}
        </li>
      ))}
    </ol>
  );
}

/** Pill links for filters that live in the URL. */
export function FilterTabs({
  items,
  active,
}: {
  items: { label: string; href: string; id: string; count?: number }[];
  active: string;
}) {
  return (
    <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
      {items.map((it) => (
        <Link
          key={it.id}
          href={it.href}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-caption font-bold transition-colors",
            it.id === active ? "bg-ink text-white" : "bg-white text-ink-mid shadow-raised hover:text-ink",
          )}
        >
          {it.label}
          {it.count !== undefined && <span className={it.id === active ? "text-white/70" : "text-ink-faint"}>{it.count}</span>}
        </Link>
      ))}
    </div>
  );
}
