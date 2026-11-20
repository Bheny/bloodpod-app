"use client";

import { useEffect, useId, useState } from "react";
import { m, useReducedMotion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type ChartPoint = { label: string; value: number };

/** Round a maximum up to a tidy number so the grid lines read 0, 5, 10 rather than 0, 4.3, 8.6. */
function niceMax(v: number) {
  if (v <= 4) return 4;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  const step = n <= 2 ? 2 : n <= 4 ? 4 : n <= 5 ? 5 : n <= 8 ? 8 : 10;
  return step * pow;
}

export const compact = (n: number) =>
  n >= 1_000_000
    ? `${+(n / 1_000_000).toFixed(1)}m`
    : n >= 10_000
      ? `${Math.round(n / 1000)}k`
      : n >= 1000
        ? `${+(n / 1000).toFixed(1)}k`
        : String(Math.round(n * 10) / 10);

/** The y-axis numbers, drawn in HTML so they never stretch with the SVG. */
function YAxis({ max, format }: { max: number; format: (n: number) => string }) {
  return (
    <div className="relative w-10 shrink-0 text-caption text-ink-muted" aria-hidden>
      {[1, 0.5, 0].map((f) => (
        <span key={f} className="absolute right-2 -translate-y-1/2 tabular-nums" style={{ top: `${(1 - f) * 100}%` }}>
          {format(max * f)}
        </span>
      ))}
    </div>
  );
}

/**
 * The number you are pointing at, shown big above the chart. It follows your finger or cursor and
 * falls back to the latest point, so the chart always says something even before it is touched.
 */
function Readout({
  label,
  value,
  previous,
  hint,
}: {
  label: string;
  value: string;
  /** Change against the point before, as a percentage. null hides it. */
  previous: number | null;
  hint?: string;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3" aria-live="polite">
      <div className="min-w-0">
        <p className="text-[26px] font-extrabold leading-none tracking-[-0.8px] text-ink tabular-nums">{value}</p>
        <p className="mt-1 truncate text-caption text-ink-muted">{label}</p>
      </div>
      <div className="shrink-0 text-right">
        {previous !== null && previous !== 0 && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-caption font-bold",
              previous > 0 ? "bg-success-soft text-success-strong" : "bg-red-light text-red-fg",
            )}
          >
            {previous > 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {Math.abs(previous)}%
          </span>
        )}
        {hint && <p className="mt-1 text-label text-ink-faint">{hint}</p>}
      </div>
    </div>
  );
}

const change = (cur: number, prev: number | undefined) =>
  prev === undefined || prev === 0 ? null : Math.round(((cur - prev) / prev) * 100);

function XLabels({ data, aligned = false }: { data: { label: string }[]; aligned?: boolean }) {
  // With only a few columns, each label sits under its own column; otherwise a handful are spread across.
  if (aligned)
    return (
      <div className="mt-2 flex gap-1.5 pl-10 text-caption text-ink-muted">
        {data.map((d, i) => (
          <span key={i} className="min-w-0 flex-1 break-words text-center leading-tight">
            {d.label}
          </span>
        ))}
      </div>
    );
  const every = Math.max(1, Math.ceil(data.length / 6));
  const shown = data.filter((_, i) => i % every === 0 || i === data.length - 1);
  return (
    <div className="mt-2 flex justify-between pl-10 text-caption text-ink-muted">
      {shown.map((d, i) => (
        <span key={i}>{d.label}</span>
      ))}
    </div>
  );
}

/**
 * A trend line you can scrub. Press and drag a finger (or move the mouse) across it and the number
 * above follows; lift a finger and the point stays selected. Plain SVG, no chart library.
 */
export function LineChart({
  data,
  height = 200,
  color = "#DD0000",
  format = compact,
  axisFormat,
  unit,
}: {
  data: ChartPoint[];
  height?: number;
  color?: string;
  format?: (n: number) => string;
  axisFormat?: (n: number) => string;
  unit?: string;
}) {
  const gradientId = useId();
  const reduce = useReducedMotion();
  const [sel, setSel] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  if (data.length === 0) return null;

  const W = 600;
  const H = 100;
  const max = niceMax(Math.max(1, ...data.map((d) => d.value)));
  const last = data.length - 1;
  const stepX = data.length > 1 ? W / last : 0;
  const x = (i: number) => i * stepX;
  const y = (v: number) => H - (v / max) * H;

  const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");
  const area = `${line} L${x(last).toFixed(1)},${H} L0,${H} Z`;
  const shown = sel ?? last;
  const pctX = (i: number) => (data.length > 1 ? (x(i) / W) * 100 : 50);

  function pick(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    setSel(Math.min(last, Math.max(0, Math.round(ratio * last))));
  }

  return (
    <div>
      <Readout
        label={`${data[shown].label}${unit ? ` · ${unit}` : ""}`}
        value={format(data[shown].value)}
        previous={change(data[shown].value, data[shown - 1]?.value)}
        hint={sel === null ? "Latest" : "Drag to explore"}
      />
      <div className="flex" style={{ height }}>
        <YAxis max={max} format={axisFormat ?? format} />
        <div
          className={cn("relative flex-1 select-none", dragging ? "touch-none" : "touch-pan-y")}
          role="group"
          tabIndex={0}
          aria-label="Trend chart. Use the left and right arrow keys to move between points."
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setSel(Math.max(0, shown - 1));
            if (e.key === "ArrowRight") setSel(Math.min(last, shown + 1));
            if (e.key === "Escape") setSel(null);
          }}
          onPointerDown={(e) => {
            // Capture so a drag keeps tracking even if the finger slides off the chart.
            e.currentTarget.setPointerCapture(e.pointerId);
            setDragging(e.pointerType !== "mouse");
            pick(e);
          }}
          onPointerMove={(e) => {
            if (e.pointerType === "mouse" || e.buttons > 0) pick(e);
          }}
          onPointerUp={() => setDragging(false)}
          onPointerLeave={(e) => {
            if (e.pointerType === "mouse") setSel(null);
          }}
        >
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="size-full overflow-visible" role="img" aria-hidden>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.24" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 0.5, 1].map((g) => (
              <line
                key={g}
                x1="0"
                x2={W}
                y1={H * g}
                y2={H * g}
                stroke="var(--color-hairline)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
                strokeDasharray={g === 1 ? undefined : "3 4"}
              />
            ))}
            <m.path
              d={area}
              fill={`url(#${gradientId})`}
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            />
            <m.path
              d={line}
              fill="none"
              stroke={color}
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              initial={reduce ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
            {sel !== null && (
              <line x1={x(shown)} x2={x(shown)} y1="0" y2={H} stroke={color} strokeWidth="1" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
            )}
          </svg>

          <span
            className="pointer-events-none absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card shadow-raised transition-[left,top] duration-100"
            style={{ left: `${pctX(shown)}%`, top: `${(y(data[shown].value) / H) * 100}%`, backgroundColor: color }}
          />
        </div>
      </div>
      <XLabels data={data} />
    </div>
  );
}

/**
 * Columns for counts per day, week or category. Tap or hover a column to read it, and it stays
 * selected until you pick another. The number above always matches the highlighted column.
 */
export function BarChart({
  data,
  height = 200,
  color = "var(--color-ink-mid)",
  highlightColor = "#DD0000",
  format = compact,
  axisFormat,
  unit,
}: {
  data: ChartPoint[];
  height?: number;
  color?: string;
  highlightColor?: string;
  format?: (n: number) => string;
  axisFormat?: (n: number) => string;
  unit?: string;
}) {
  const reduce = useReducedMotion();
  const [sel, setSel] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  if (data.length === 0) return null;

  const max = niceMax(Math.max(1, ...data.map((d) => d.value)));
  const last = data.length - 1;
  const dense = data.length > 14;
  const shown = hover ?? sel ?? last;
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div>
      <Readout
        label={`${data[shown].label}${unit ? ` · ${unit}` : ""}`}
        value={format(data[shown].value)}
        previous={change(data[shown].value, data[shown - 1]?.value)}
        hint={`${format(total)} in total`}
      />
      <div className="flex" style={{ height }}>
        <YAxis max={max} format={axisFormat ?? format} />
        <div
          className="relative flex-1"
          role="group"
          tabIndex={0}
          aria-label="Column chart. Use the left and right arrow keys to move between columns."
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setSel(Math.max(0, shown - 1));
            if (e.key === "ArrowRight") setSel(Math.min(last, shown + 1));
            if (e.key === "Escape") setSel(null);
          }}
          onPointerLeave={() => setHover(null)}
        >
          {[0, 0.5, 1].map((g) => (
            <span
              key={g}
              className="pointer-events-none absolute inset-x-0 border-t border-hairline"
              style={{ top: `${g * 100}%`, borderStyle: g === 1 ? "solid" : "dashed" }}
            />
          ))}
          <div className={cn("absolute inset-0 flex items-end", dense ? "gap-[2px]" : "gap-1.5")}>
            {data.map((d, i) => (
              <button
                key={i}
                type="button"
                tabIndex={-1}
                aria-label={`${d.label}: ${format(d.value)}`}
                aria-pressed={sel === i}
                onPointerEnter={(e) => e.pointerType === "mouse" && setHover(i)}
                onClick={() => setSel(sel === i ? null : i)}
                className="flex h-full min-w-0 flex-1 touch-manipulation items-end"
              >
                <m.span
                  className="block w-full rounded-t-[4px]"
                  initial={reduce ? false : { height: 0 }}
                  animate={{
                    height: `${Math.max((d.value / max) * 100, d.value > 0 ? 2 : 0)}%`,
                    opacity: hover === null && sel === null ? 1 : shown === i ? 1 : 0.5,
                  }}
                  // Colour is a plain style, not animated by framer: it can be a theme variable, which framer cannot tween.
                  style={{
                    backgroundColor: shown === i && (hover !== null || sel !== null) ? highlightColor : color,
                    transition: reduce ? undefined : "background-color 150ms ease-out",
                  }}
                  transition={{ duration: 0.45, delay: reduce ? 0 : Math.min(i * 0.02, 0.4), ease: "easeOut" }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
      <XLabels data={data} aligned={data.length <= 8} />
    </div>
  );
}

export const DONUT_COLORS = ["#DD0000", "#F59E0B", "#1D4ED8", "#1FA855", "#8B5CF6", "#0EA5E9", "#EC4899", "#6B7280"];

/** Share of a whole. Tap a slice or a legend row to read it; the middle shows the total until you do. */
export function Donut({
  slices,
  centerLabel,
  format = (n: number) => String(n),
  size = 148,
}: {
  slices: { label: string; value: number; color?: string }[];
  centerLabel?: string;
  format?: (n: number) => string;
  size?: number;
}) {
  const [sel, setSel] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    // One frame after mount, so the slices sweep in instead of appearing.
    const id = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const total = slices.reduce((s, d) => s + d.value, 0);
  const coloured = slices.map((s, i) => ({ ...s, color: s.color ?? DONUT_COLORS[i % DONUT_COLORS.length] }));
  const active = hover ?? sel;

  const R = 15.9155; // circumference is 100, so dash lengths are percentages
  const gap = coloured.filter((s) => s.value > 0).length > 1 ? 0.8 : 0;
  const centre = active !== null ? coloured[active] : null;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox="0 0 42 42" className="size-full -rotate-90" role="img" aria-label="Breakdown chart">
          <circle cx="21" cy="21" r={R} fill="none" stroke="var(--color-fill)" strokeWidth="5.5" />
          {total > 0 &&
            coloured.map((s, i) => {
              const len = (s.value / total) * 100;
              const dash = drawn ? Math.max(len - gap, 0) : 0;
              const el = (
                <circle
                  key={s.label}
                  cx="21"
                  cy="21"
                  r={R}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={active === i ? 7 : 5.5}
                  strokeDasharray={`${dash} ${100 - dash}`}
                  strokeDashoffset={-offset}
                  opacity={active === null || active === i ? 1 : 0.3}
                  className="cursor-pointer transition-all duration-500 ease-out"
                  onPointerEnter={(e) => e.pointerType === "mouse" && setHover(i)}
                  onPointerLeave={() => setHover(null)}
                  onClick={() => setSel(sel === i ? null : i)}
                />
              );
              offset += len;
              return el;
            })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[26px] font-extrabold leading-none tracking-[-1px] text-ink">{format(centre ? centre.value : total)}</span>
          <span className="mt-1 max-w-[84px] truncate text-caption text-ink-muted">
            {centre ? `${centre.label} · ${total > 0 ? Math.round((centre.value / total) * 100) : 0}%` : (centerLabel ?? "Total")}
          </span>
        </div>
      </div>

      <ul className="w-full min-w-0 flex-1 space-y-1">
        {coloured.map((s, i) => (
          <li key={s.label}>
            <button
              type="button"
              aria-pressed={sel === i}
              onPointerEnter={(e) => e.pointerType === "mouse" && setHover(i)}
              onPointerLeave={() => setHover(null)}
              onClick={() => setSel(sel === i ? null : i)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-caption transition-colors",
                active === i ? "bg-surface" : "hover:bg-surface/60",
              )}
            >
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="min-w-0 flex-1 truncate font-semibold text-ink">{s.label}</span>
              <span className="shrink-0 tabular-nums text-ink">{format(s.value)}</span>
              <span className="w-9 shrink-0 text-right tabular-nums text-ink-muted">{total > 0 ? Math.round((s.value / total) * 100) : 0}%</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A tiny trend for a stat card. No axes, just the shape. */
export function Sparkline({ values, color = "#DD0000" }: { values: number[]; color?: string }) {
  const gradientId = useId();
  if (values.length < 2) return null;
  const W = 100;
  const H = 28;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = Math.max(1, max - min);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * W, H - 2 - ((v - min) / span) * (H - 4)] as const);
  const line = pts.map(([px, py], i) => `${i === 0 ? "M" : "L"}${px.toFixed(1)},${py.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="mt-3 h-7 w-full overflow-visible" aria-hidden>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${W},${H} L0,${H} Z`} fill={`url(#${gradientId})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Two series side by side per period (e.g. income against spending by month). Tap a month to read both. */
export function PairedBars({
  data,
  aLabel,
  bLabel,
  aColor = "#1FA855",
  bColor = "var(--color-ink-mid)",
  format = compact,
  axisFormat,
  height = 200,
}: {
  data: { label: string; a: number; b: number }[];
  aLabel: string;
  bLabel: string;
  aColor?: string;
  bColor?: string;
  format?: (n: number) => string;
  axisFormat?: (n: number) => string;
  height?: number;
}) {
  const reduce = useReducedMotion();
  const [sel, setSel] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(1, ...data.flatMap((d) => [d.a, d.b])));
  const empty = data.every((d) => d.a === 0 && d.b === 0);
  const shown = hover ?? sel ?? data.length - 1;
  const cur = data[shown];
  const picked = hover !== null || sel !== null;

  return (
    <div>
      {cur && (
        <div className="mb-3 grid grid-cols-2 gap-3" aria-live="polite">
          {[
            { name: aLabel, v: cur.a, c: aColor },
            { name: bLabel, v: cur.b, c: bColor },
          ].map((s) => (
            <div key={s.name} className="rounded-xl bg-surface px-3 py-2">
              <p className="flex items-center gap-1.5 text-caption text-ink-muted">
                <span className="size-2.5 rounded-sm" style={{ backgroundColor: s.c }} /> {s.name} · {cur.label}
              </p>
              <p className="mt-0.5 text-[20px] font-extrabold leading-tight tracking-[-0.5px] text-ink tabular-nums">{format(s.v)}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex" style={{ height }}>
        <YAxis max={max} format={axisFormat ?? format} />
        <div className="relative flex-1" onPointerLeave={() => setHover(null)}>
          {[0, 0.5, 1].map((g) => (
            <span
              key={g}
              className="pointer-events-none absolute inset-x-0 border-t border-hairline"
              style={{ top: `${g * 100}%`, borderStyle: g === 1 ? "solid" : "dashed" }}
            />
          ))}
          <div className="absolute inset-0 flex items-end gap-2">
            {data.map((d, i) => (
              <button
                key={d.label}
                type="button"
                aria-label={`${d.label}: ${aLabel} ${format(d.a)}, ${bLabel} ${format(d.b)}`}
                aria-pressed={sel === i}
                onPointerEnter={(e) => e.pointerType === "mouse" && setHover(i)}
                onClick={() => setSel(sel === i ? null : i)}
                className="flex h-full min-w-0 flex-1 touch-manipulation items-end justify-center gap-0.5"
              >
                {[
                  { v: d.a, c: aColor },
                  { v: d.b, c: bColor },
                ].map((bar, k) => (
                  <m.span
                    key={k}
                    className="block w-full max-w-6 rounded-t-[4px]"
                    initial={reduce ? false : { height: 0 }}
                    animate={{
                      height: `${Math.max((bar.v / max) * 100, bar.v > 0 ? 2 : 0)}%`,
                      opacity: !picked || shown === i ? 1 : 0.45,
                    }}
                    transition={{ duration: 0.45, delay: reduce ? 0 : i * 0.05, ease: "easeOut" }}
                    style={{ backgroundColor: bar.c }}
                  />
                ))}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-2 flex gap-2 pl-10 text-caption text-ink-muted">
        {data.map((d, i) => (
          <span key={d.label} className={cn("min-w-0 flex-1 text-center", picked && shown === i && "font-bold text-ink")}>
            {d.label}
          </span>
        ))}
      </div>
      {empty && <p className="mt-3 text-center text-caption text-ink-muted">Nothing recorded in these months yet.</p>}
    </div>
  );
}
