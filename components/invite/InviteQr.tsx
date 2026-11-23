"use client";

import { useMemo, useState } from "react";
import { Download, Maximize2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { buildQrArt, QR_COLORS, type QrArt } from "@/lib/qr-art";

function QrSvg({ art, className, id }: { art: QrArt; className?: string; id?: string }) {
  const { ink, red, paper } = QR_COLORS;
  const { x, side } = art.logo;
  const mid = x + side / 2;
  return (
    <svg
      id={id}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${art.size} ${art.size}`}
      className={className}
      role="img"
      aria-label="QR code that opens your Pod invite"
    >
      <rect width={art.size} height={art.size} fill={paper} />
      <path d={art.dots} fill={ink} />
      {art.eyes.map((e) => (
        <g key={`${e.x}-${e.y}`}>
          <rect x={e.x} y={e.y} width={7} height={7} rx={2.2} fill={red} />
          <rect x={e.x + 1} y={e.y + 1} width={5} height={5} rx={1.5} fill={paper} />
          <rect x={e.x + 2} y={e.y + 2} width={3} height={3} rx={1} fill={ink} />
        </g>
      ))}
      {/* The BloodPod mark, on a clear patch in the middle. */}
      <circle cx={mid} cy={mid} r={side / 2} fill={paper} />
      <g transform={`translate(${mid - side * 0.36} ${mid - side * 0.36}) scale(${(side * 0.72) / 32})`}>
        <ellipse cx="12" cy="16" rx="10" ry="11" fill={ink} />
        <ellipse cx="20" cy="16" rx="10" ry="11" fill={red} />
        <ellipse cx="16" cy="16" rx="4.5" ry="5.5" fill={paper} />
      </g>
    </svg>
  );
}

/** Draws the sharing card (pod name, code, QR) to a PNG the owner can save or post. */
async function saveCard(podName: string, code: string) {
  const { ink, red, paper } = QR_COLORS;
  const svg = document.getElementById("invite-qr-source");
  if (!svg) return;

  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("QR image failed to load"));
      img.src = url;
    });

    const W = 1080;
    const H = 1400;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = red;
    ctx.fillRect(0, 0, W, 16);

    ctx.textAlign = "center";
    ctx.fillStyle = ink;
    ctx.font = "800 64px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillText("Join my BloodPod", W / 2, 170, W - 120);
    ctx.fillStyle = red;
    ctx.font = "700 44px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillText(podName, W / 2, 240, W - 120);

    const qr = 840;
    ctx.drawImage(img, (W - qr) / 2, 300, qr, qr);

    ctx.fillStyle = "#6B6B70";
    ctx.font = "600 38px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillText("Scan with your phone camera", W / 2, 1210);
    ctx.fillStyle = ink;
    ctx.font = "800 84px ui-monospace, Menlo, Consolas, monospace";
    ctx.fillText(code.split("").join(" "), W / 2, 1305);
    ctx.fillStyle = "#6B6B70";
    ctx.font = "600 34px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillText("or enter this code in the app", W / 2, 1360);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) return;
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = `bloodpod-invite-${code}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(href), 2000);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function InviteQr({ inviteUrl, inviteCode, podName }: { inviteUrl: string; inviteCode: string; podName: string }) {
  const art = useMemo(() => buildQrArt(inviteUrl), [inviteUrl]);
  const [full, setFull] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await saveCard(podName, inviteCode);
    } catch {
      // saving is a convenience; the code on screen still works
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="mt-2.5 rounded-2xl bg-surface p-3">
        <p className="text-body-sm font-extrabold text-ink">Scan to join</p>
        <p className="mb-2 text-[10px] text-ink-faint">Hold it up for someone to scan with their camera</p>

        <button
          type="button"
          onClick={() => setFull(true)}
          aria-label="Show the QR code full screen"
          className="mx-auto block w-full max-w-52 overflow-hidden rounded-3xl border-[0.5px] border-hairline bg-white p-1.5 shadow-raised transition-transform active:scale-[0.98]"
        >
          <QrSvg art={art} id="invite-qr-source" className="block w-full" />
        </button>

        <div className="mt-2.5 flex gap-1.5">
          <button
            type="button"
            onClick={() => setFull(true)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-card py-2.5 text-label font-bold text-ink-mid"
          >
            <Maximize2 className="size-3.5" aria-hidden /> Full screen
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-label font-bold text-white disabled:opacity-60"
            style={{ backgroundColor: "#1C1C1E" }}
          >
            <Download className="size-3.5" aria-hidden /> {saving ? "Saving…" : "Save image"}
          </button>
        </div>
      </div>

      <Modal open={full} onClose={() => setFull(false)}>
        <div className="p-5 text-center">
          <p className="text-body-sm font-bold text-ink">{podName}</p>
          <div className="mx-auto mt-3 w-full max-w-72 overflow-hidden rounded-3xl border-[0.5px] border-hairline bg-white p-2">
            <QrSvg art={art} className="block w-full" />
          </div>
          <p className="mt-3 font-mono text-lg font-extrabold tracking-[4px] text-ink">{inviteCode}</p>
          <button
            type="button"
            onClick={() => setFull(false)}
            className="mt-4 min-h-11 w-full rounded-full bg-surface text-body-sm font-bold text-ink"
          >
            Done
          </button>
        </div>
      </Modal>
    </>
  );
}
