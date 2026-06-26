"use client";

import { useState } from "react";
import { LogoMark } from "@/components/ui/Logo";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { BLOOD_TYPE_LABELS } from "@/lib/blood-type";
import type { BloodType } from "@prisma/client";

const MAX_LENGTH = 32;

function slugPreview(name: string) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
  return slug || "your-pod";
}

export function Step3PodName({
  defaultName,
  bloodType,
  onCreated,
  onNext,
}: {
  defaultName: string;
  bloodType: BloodType | null;
  onCreated: (podId: string, slug: string, name: string) => void;
  onNext: () => void;
}) {
  const [name, setName] = useState(defaultName);
  const [saving, setSaving] = useState(false);

  async function handleContinue() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      const res = await fetch("/api/pods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (data.podId) onCreated(data.podId, data.slug, trimmed);
    } catch {
      // never block onboarding progress on a network hiccup
    }
    setSaving(false);
    onNext();
  }

  return (
    <div className="flex flex-1 flex-col px-6 py-10">
      <div className="flex-1">
        <p className="text-[11px] font-bold uppercase tracking-[2px] text-red">Your pod</p>
        <h1 className="mt-3 text-[22px] font-extrabold tracking-[-0.6px] text-ink">
          Name your circle.
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          This is what people see when you invite them.
        </p>

        <div className="mt-6">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, MAX_LENGTH))}
            placeholder="Your Pod"
            className="text-base font-semibold"
            maxLength={MAX_LENGTH}
            autoFocus
          />
          {name.length >= MAX_LENGTH - 8 && (
            <p className="mt-1 text-right text-xs text-ink-faint">
              {name.length}/{MAX_LENGTH}
            </p>
          )}
        </div>

        <div className="mt-2 rounded-lg bg-surface px-3 py-2">
          <p className="text-xs text-ink-muted">bloodpod.gh/pod/{slugPreview(name)}</p>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-card border-[0.5px] border-[#E5E5EA] bg-white p-3">
          <LogoMark className="size-8 shrink-0" />
          <div>
            <p className="text-sm font-bold text-ink">{name.trim() || "Your Pod"}</p>
            <p className="text-xs text-ink-muted">
              0 members · {bloodType ? BLOOD_TYPE_LABELS[bloodType] : "no blood type yet"}
            </p>
          </div>
        </div>
      </div>

      <Button
        onClick={handleContinue}
        disabled={!name.trim()}
        loading={saving}
        size="lg"
        className="w-full"
      >
        Create my pod →
      </Button>
    </div>
  );
}
