"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

export type ChartPoint = { label: string; value: number };

/**
 * A line chart with a soft fill and a hover read-out. Plain SVG, no chart library.
 * The SVG is stretched to its container; the tooltip is HTML so text never distorts.
 */
export function LineChart({
  data,
  height = 200,
  color = "#DD0000",
  format = (n: number) => String(n),
}: {
  data: ChartPoint[];
  height?: number;
  color?: string;
  format?: (n: number) => string;
}) {
  const gradientId = useId();
  const [hover, setHover] = useState<number | null>(null);

  if (data.length === 0) return null;

  const W = 600;
  const H = 100;
  const pad = 4;
  const max = Math.max(1, ...data.map((d) => d.value));
  const stepX = data.length > 1 ? (W - pad * 2) / (data.length - 1) : 0;
  const x = (i: number) => pad + i * stepX;
  const y = (v: number) => H - pad - (v / max) * (H - pad * 2);

  const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");
  const area = `${line} L${x(data.length - 1).toFixed(1)},${H} L${x(0).toFixed(1)},${H} Z`;

  const active = hover ?? null;
  const labelEvery = Math.max(1, Math.ceil(data.length / 6));

  return (
    <div>
      <div
        className="relative"
        style={{ height }}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const ratio = (e.clientX - rect.left) / rect.width;
          setHover(Math.min(data.length - 1, Math.max(0, Math.round(ratio * (data.length - 1)))));
        }}
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="size-full overflow-visible" role="img" aria-label="Trend chart">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.22" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((g) => (
            <line key={g} x1="0" x2={W} y1={H * g} y2={H * g} stroke="var(--color-hairline)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          ))}
          <path d={area} fill={`url(#${gradientId})`} />
          <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          {active !== null && (
            <line x1={x(active)} x2={x(active)} y1="0" y2={H} stroke={color} strokeWidth="1" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
          )}
        </svg>

        {active !== null && (
          <>
            <span
              className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card"
              style={{ left: `${(x(active) / W) * 100}%`, top: `${(y(data[active].value) / H) * 100}%`, backgroundColor: color }}
            />
            <div
              className="pointer-events-none absolute -top-1 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-panel px-2.5 py-1.5 text-caption text-white shadow-raised"
              style={{ left: `${Math.min(88, Math.max(12, (x(active) / W) * 100))}%` }}
            >
              <span className="font-bold">{format(data[active].value)}</span>
              <span className="ml-1.5 text-white/70">{data[active].label}</span>
            </div>
          </>
        )}
      </div>

      <div className="mt-2 flex justify-between text-caption text-ink-muted">
        {data.map((d, i) => (i % labelEvery === 0 || i === data.length - 1 ? <span key={i}>{d.label}</span> : null))}
      </div>
    </div>
  );
}

/** Grouped bars comparing two series per period (e.g. income against spending by month). */
export function PairedBars({
  data,
  aLabel,
  bLabel,
  aColor = "#1FA855",
  bColor = "#1C1C1E",
  format = (n: number) => String(n),
  height = 200,
}: {
  data: { label: string; a: number; b: number }[];
  aLabel: string;
  bLabel: string;
  aColor?: string;
  bColor?: string;
  format?: (n: number) => string;
  height?: number;
}) {
  const max = Math.max(1, ...data.flatMap((d) => [d.a, d.b]));
  const empty = data.every((d) => d.a === 0 && d.b === 0);

  return (
    <div>
      <div className="mb-3 flex gap-4 text-caption text-ink-muted">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ backgroundColor: aColor }} /> {aLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ backgroundColor: bColor }} /> {bLabel}
        </span>
      </div>

      <div className="flex items-end gap-3" style={{ height }}>
        {data.map((d) => (
          <div key={d.label} className="flex h-full min-w-0 flex-1 flex-col justify-end">
            <div className="flex flex-1 items-end justify-center gap-1">
              <div
                title={`${aLabel}: ${format(d.a)}`}
                className={cn("w-full max-w-7 rounded-t-md", d.a === 0 && "opacity-20")}
                style={{ height: `${Math.max((d.a / max) * 100, d.a > 0 ? 3 : 1)}%`, backgroundColor: aColor }}
              />
              <div
                title={`${bLabel}: ${format(d.b)}`}
                className={cn("w-full max-w-7 rounded-t-md", d.b === 0 && "opacity-20")}
                style={{ height: `${Math.max((d.b / max) * 100, d.b > 0 ? 3 : 1)}%`, backgroundColor: bColor }}
              />
            </div>
            <p className="mt-2 text-center text-caption text-ink-muted">{d.label}</p>
          </div>
        ))}
      </div>
      {empty && <p className="mt-3 text-center text-caption text-ink-muted">Nothing recorded in these months yet.</p>}
    </div>
  );
}
