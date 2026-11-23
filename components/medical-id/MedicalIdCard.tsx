"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { buildMedicalId, wrapText, type MedicalIdSource, type MedicalIdView } from "@/lib/medical-id";
import { InfoTip } from "@/components/ui/InfoTip";

const W = 1170;
const H = 2532; // a tall phone screen. The clock sits in the top third, so the card starts lower.

/** Draws the Medical ID on a canvas. Everything stays on this device: nothing is uploaded. */
function drawCard(view: MedicalIdView, family: string): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#1C1C1E";
  ctx.fillRect(0, 0, W, H);

  const left = 90;
  const maxW = W - left * 2;
  const font = (size: number, weight = 600) => `${weight} ${size}px ${family}`;
  const measure = (s: string) => ctx.measureText(s).width;
  const limit = H - 190;
  let y = 860;

  const label = (text: string) => {
    ctx.font = font(34, 700);
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.textAlign = "left";
    ctx.fillText(text.toUpperCase().split("").join(" "), left, y);
    y += 62;
  };
  const para = (text: string, size = 54, weight = 600) => {
    ctx.font = font(size, weight);
    ctx.fillStyle = "#FFFFFF";
    for (const line of wrapText(text, maxW, measure)) {
      if (y > limit) return;
      ctx.fillText(line, left, y);
      y += size * 1.3;
    }
  };

  label("Medical ID");
  if (view.name) para(view.name, 64, 800);
  y += 24;

  // Blood group: the one thing a stranger must be able to read from across a room.
  ctx.fillStyle = "#DD0000";
  ctx.beginPath();
  ctx.roundRect(left, y, maxW, 380, 56);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.font = font(view.bloodType ? 280 : 120, 800);
  ctx.fillText(view.bloodType ?? "Blood group not set", W / 2, y + (view.bloodType ? 300 : 230));
  ctx.textAlign = "left";
  y += 380 + 80;

  if (view.genotype) {
    para(`Genotype ${view.genotype}`, 56, 700);
    y += 30;
  }
  if (view.allergies.length) {
    label("Allergies");
    para(view.allergies.join(", "));
    y += 40;
  }
  if (view.conditions.length) {
    label("Conditions");
    para(view.conditions.join(", "));
    y += 40;
  }
  if (view.medications.length) {
    label("Medications");
    para(view.medications.join(", "));
    y += 40;
  }
  if (view.contact && y < limit) {
    label("Emergency contact");
    if (view.contact.name) para(view.contact.name, 58, 700);
    if (view.contact.phone) para(view.contact.phone, 76, 800);
  }

  ctx.font = font(32, 600);
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.textAlign = "center";
  ctx.fillText("Made with BloodPod", W / 2, H - 90);
  return canvas;
}

export function MedicalIdCard({ source }: { source: MedicalIdSource }) {
  const [includeConditions, setIncludeConditions] = useState(false);
  const [includeMedications, setIncludeMedications] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const view = useMemo(() => buildMedicalId(source, { includeConditions, includeMedications }), [source, includeConditions, includeMedications]);

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      await document.fonts.ready;
      const canvas = drawCard(view, getComputedStyle(document.body).fontFamily || "sans-serif");
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("no image");
      const file = new File([blob], "bloodpod-medical-id.png", { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: "Medical ID" });
          setMessage("Saved. Set it as your lock screen from your photos.");
          return;
        } catch (err) {
          if ((err as Error).name === "AbortError") return; // they closed the share sheet
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setMessage("Saved to your downloads. Set it as your lock screen from your photos.");
    } catch {
      setMessage("Could not make the image on this device. Try a screenshot of the card instead.");
    } finally {
      setBusy(false);
    }
  }

  const row = "text-body-sm text-white";
  const lab = "text-label font-bold uppercase tracking-[1.5px] text-white/60";

  return (
    <div className="flex flex-col gap-3.5">
      <section aria-label="Your Medical ID" className="rounded-3xl bg-[#1C1C1E] p-5 text-white shadow-raised lg:rounded-2xl lg:p-6">
        <p className={lab}>Medical ID</p>
        {view.name && <p className="mt-1 text-title font-extrabold">{view.name}</p>}

        <div className="mt-3 flex min-h-28 items-center justify-center rounded-2xl bg-[#DD0000] px-4 py-5">
          <span className={view.bloodType ? "text-[72px] font-extrabold leading-none" : "text-body-sm font-bold"}>{view.bloodType ?? "Blood group not set"}</span>
        </div>

        <dl className="mt-4 flex flex-col gap-3.5">
          {view.genotype && (
            <div>
              <dt className={lab}>Genotype</dt>
              <dd className={row}>{view.genotype}</dd>
            </div>
          )}
          {view.allergies.length > 0 && (
            <div>
              <dt className={lab}>Allergies</dt>
              <dd className={row}>{view.allergies.join(", ")}</dd>
            </div>
          )}
          {view.conditions.length > 0 && (
            <div>
              <dt className={lab}>Conditions</dt>
              <dd className={row}>{view.conditions.join(", ")}</dd>
            </div>
          )}
          {view.medications.length > 0 && (
            <div>
              <dt className={lab}>Medications</dt>
              <dd className={row}>{view.medications.join(", ")}</dd>
            </div>
          )}
          {view.contact && (
            <div>
              <dt className={lab}>Emergency contact</dt>
              <dd className={row}>
                {view.contact.name && <span className="block font-bold">{view.contact.name}</span>}
                {view.contact.phone && <span className="block text-title font-extrabold">{view.contact.phone}</span>}
              </dd>
            </div>
          )}
        </dl>
      </section>

      {view.missing.length > 0 && (
        <p className="rounded-2xl bg-red-light px-4 py-3 text-body-sm text-red-fg">
          Add {view.missing.join(", ")} so a stranger can help you.{" "}
          <Link href="/medical-history" className="font-bold underline underline-offset-2">
            Update your details
          </Link>
        </p>
      )}

      <section className="rounded-3xl border-[0.5px] border-hairline bg-card p-4 shadow-raised lg:rounded-2xl">
        <h2 className="flex items-center gap-1.5 text-body-sm font-bold text-ink">
          What goes on the image <InfoTip term="medicalId" />
        </h2>
        <p className="mt-1 text-caption text-ink-muted">Blood group, genotype, allergies and your emergency contact are always included. Anyone who sees your lock screen can read them.</p>
        <label className="mt-3 flex min-h-11 items-center gap-3 text-body-sm text-ink">
          <input type="checkbox" checked={includeConditions} onChange={(e) => setIncludeConditions(e.target.checked)} className="size-4 accent-red" />
          Also show my conditions
        </label>
        <label className="flex min-h-11 items-center gap-3 text-body-sm text-ink">
          <input type="checkbox" checked={includeMedications} onChange={(e) => setIncludeMedications(e.target.checked)} className="size-4 accent-red" />
          Also show my medications
        </label>

        <Button type="button" onClick={save} loading={busy} size="lg" className="mt-3 w-full">
          <Download className="size-4" aria-hidden /> Save as a lock screen image
        </Button>
        {message && (
          <p className="mt-2 text-center text-caption text-ink-mid" role="status">
            {message}
          </p>
        )}
        <p className="mt-3 text-caption leading-relaxed text-ink-muted">
          The image is made on your phone and is not uploaded. Then, on iPhone, open it in Photos, tap Share and choose Use as Wallpaper. On Android, open it in your gallery and choose Set as wallpaper. It works with no signal, because it is a picture.
        </p>
      </section>
    </div>
  );
}
