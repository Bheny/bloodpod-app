"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Share2 } from "lucide-react";
import type { LeaderRow } from "@/lib/admin/garden-leaderboard";

const W = 1080;
const H = 1350;
const FONT = '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif';
const ANON = "A BloodPod gardener";

/** First name only. Anyone who opted out has no name at all (the server leaves it out), so they show as nameless. */
function displayName(r: LeaderRow): string {
  if (!r.named || !r.name?.trim()) return ANON;
  return r.name.trim().split(/\s+/)[0];
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fit(ctx: CanvasRenderingContext2D, text: string, max: number): string {
  if (ctx.measureText(text).width <= max) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > max) t = t.slice(0, -1);
  return `${t}…`;
}

function draw(canvas: HTMLCanvasElement, rows: { name: string; line: string; value: number }[], by: "people" | "weeks", label: string) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  canvas.width = W;
  canvas.height = H;

  ctx.fillStyle = "#1C1C1E";
  ctx.fillRect(0, 0, W, H);

  // Header
  ctx.fillStyle = "#DD0000";
  roundRect(ctx, 60, 60, 190, 48, 24);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `800 24px ${FONT}`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText("BLOODPOD", 155, 85);

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = `800 84px ${FONT}`;
  ctx.fillText("Garden Leaders", 60, 215);
  ctx.fillStyle = "rgba(255,255,255,0.62)";
  ctx.font = `500 30px ${FONT}`;
  ctx.fillText(by === "people" ? `Donors with the most ready people in their Pods · ${label}` : `Donors who tend their Pods most, week after week · ${label}`, 60, 265, W - 120);

  // Rows
  const top = 305;
  const rowH = 84;
  const gap = 9;
  rows.forEach((r, i) => {
    const y = top + i * (rowH + gap);
    const lead = i < 3;
    ctx.fillStyle = lead ? "#2D2D31" : "#252528";
    roundRect(ctx, 60, y, W - 120, rowH, 22);
    ctx.fill();

    // Rank badge
    ctx.fillStyle = lead ? "#DD0000" : "#3A3A3F";
    ctx.beginPath();
    ctx.arc(112, y + rowH / 2, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `800 28px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(i + 1), 112, y + rowH / 2 + 1);

    // Name and line
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `700 33px ${FONT}`;
    ctx.fillText(fit(ctx, r.name, 520), 168, y + 38);
    ctx.fillStyle = "rgba(255,255,255,0.58)";
    ctx.font = `500 22px ${FONT}`;
    ctx.fillText(fit(ctx, r.line, 560), 168, y + 66);

    // Number
    ctx.textAlign = "right";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `800 44px ${FONT}`;
    ctx.fillText(String(r.value), W - 100 - 118, y + 56);
    ctx.fillStyle = "rgba(255,255,255,0.58)";
    ctx.font = `600 21px ${FONT}`;
    ctx.textAlign = "left";
    ctx.fillText(by === "people" ? "ready" : "weeks", W - 100 - 108, y + 55);
  });

  // Footer
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = `600 26px ${FONT}`;
  ctx.fillText("Emergency alerts are always free.", W / 2, H - 70);
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = `500 22px ${FONT}`;
  ctx.fillText("Build a Pod of people you trust. Thank you to everyone tending theirs.", W / 2, H - 34, W - 120);
}

export function LeaderboardPoster({ rows, by, label }: { rows: LeaderRow[]; by: "people" | "weeks"; label: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [shared, setShared] = useState<string | null>(null);

  const shown = useMemo(() => rows.filter((r) => !skipped.has(r.userId)).slice(0, 10), [rows, skipped]);
  const lines = useMemo(
    () =>
      shown.map((r) => ({
        name: displayName(r),
        line: [r.title, `${r.stage} Garden`].filter(Boolean).join(" · "),
        value: by === "people" ? r.uniqueReady : r.weeks,
      })),
    [shown, by],
  );

  useEffect(() => {
    if (canvasRef.current) draw(canvasRef.current, lines, by, label);
  }, [lines, by, label]);

  function toggle(id: string) {
    setSkipped((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const fileName = `bloodpod-garden-leaders-${label.toLowerCase().replace(/\s+/g, "-")}.png`;
  const toBlob = () => new Promise<Blob | null>((res) => canvasRef.current?.toBlob(res, "image/png"));

  async function download() {
    const blob = await toBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function share() {
    const blob = await toBlob();
    if (!blob) return;
    const file = new File([blob], fileName, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "BloodPod Garden Leaders" });
        return;
      } catch {
        return; // cancelled
      }
    }
    setShared("Sharing is not available here. Use Download.");
  }

  const featured = shown.filter((r) => r.named).length;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <div className="flex flex-col gap-4">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Garden Leaders poster preview"
          className="w-full rounded-2xl shadow-raised"
          style={{ aspectRatio: `${W} / ${H}` }}
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={download}
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-red px-5 text-body-sm font-bold text-white transition-transform active:scale-[0.98] motion-reduce:transition-none"
          >
            <Download className="size-4" aria-hidden /> Download image
          </button>
          <button
            type="button"
            onClick={share}
            className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-card px-5 text-body-sm font-bold text-ink shadow-raised transition-transform active:scale-[0.98] motion-reduce:transition-none"
          >
            <Share2 className="size-4" aria-hidden /> Share
          </button>
        </div>
        {shared && <p className="text-caption text-ink-muted">{shared}</p>}
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-2xl bg-card p-4 shadow-raised">
          <p className="text-body-sm font-bold text-ink">Names on the poster</p>
          <p className="mt-1 text-caption text-ink-muted">
            First names only. Donors who asked to be kept off show as &quot;{ANON}&quot;, and that can&apos;t be changed here.
            {shown.length > 0 && ` ${featured} of ${shown.length} on this poster ${featured === 1 ? "is" : "are"} named.`}
          </p>
        </div>

        <div className="rounded-2xl bg-card p-4 shadow-raised">
          <p className="text-body-sm font-bold text-ink">Who is on it</p>
          <p className="mt-0.5 text-caption text-ink-muted">Untick anyone to leave them off. The next person moves up.</p>
          <ul className="mt-3 flex flex-col divide-y-[0.5px] divide-hairline">
            {rows.map((r, i) => {
              const off = skipped.has(r.userId);
              return (
                <li key={r.userId}>
                  <label className="flex min-h-11 cursor-pointer items-center gap-3 py-2">
                    <input type="checkbox" checked={!off} onChange={() => toggle(r.userId)} className="size-4 accent-[#DD0000]" />
                    <span className="w-6 text-caption font-bold text-ink-muted">{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-body-sm font-semibold ${off ? "text-ink-faint line-through" : "text-ink"}`}>
                        {r.name ?? "Opted out"}
                      </span>
                      <span className="block truncate text-caption text-ink-muted">
                        {r.uniqueReady} ready · {r.weeks} {r.weeks === 1 ? "week" : "weeks"} · {r.plots} {r.plots === 1 ? "plot" : "plots"}
                      </span>
                    </span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-label font-bold ${r.named ? "bg-success-soft text-success-strong" : "bg-surface text-ink-muted"}`}>
                      {r.named ? "Named" : "Anonymous"}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
