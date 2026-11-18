"use client";

import { useState } from "react";
import { LogoMark } from "@/components/ui/Logo";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { BLOOD_TYPE_LABELS } from "@/lib/blood-type";
import type { BloodType } from "@prisma/client";

const MAX_LENGTH = 32;
const KINDS = ["Church", "Office", "School", "Gym", "Family"];

export function Step3PodName({
  defaultName,
  firstName,
  bloodType,
  onCreated,
  onNext,
}: {
  defaultName: string;
  firstName: string | null;
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
        <p className="text-[11px] font-bold uppercase tracking-[2px] text-red">Your Pod</p>
        <h1 className="mt-3 text-[22px] font-extrabold tracking-[-0.6px] text-ink">Who will you build it with?</h1>
        <p className="mt-2 text-sm text-ink-muted">
          A Pod is 10 to 20 people you trust. Pick a group to start, or type your own name.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {KINDS.map((k) => {
            const suggestion = `${firstName ? `${firstName}'s ` : "My "}${k} Pod`.slice(0, MAX_LENGTH);
            return (
              <button
                key={k}
                type="button"
                onClick={() => setName(suggestion)}
                className="rounded-full border border-[#E5E5EA] bg-white px-3.5 py-1.5 text-sm font-semibold text-ink-mid transition-colors hover:border-red-mid"
              >
                {k}
              </button>
            );
          })}
        </div>

        <div className="mt-5">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, MAX_LENGTH))}
            placeholder="Your Pod"
            className="text-base font-semibold"
            maxLength={MAX_LENGTH}
            aria-label="Pod name"
          />
          {name.length >= MAX_LENGTH - 8 && (
            <p className="mt-1 text-right text-xs text-ink-faint">
              {name.length}/{MAX_LENGTH}
            </p>
          )}
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-card border-[0.5px] border-[#E5E5EA] bg-white p-3">
          <LogoMark className="size-8 shrink-0" />
          <div>
            <p className="text-sm font-bold text-ink">{name.trim() || "Your Pod"}</p>
            <p className="text-xs text-ink-muted">
              1 member · {bloodType ? BLOOD_TYPE_LABELS[bloodType] : "blood type not set"}
            </p>
          </div>
        </div>
      </div>

      <Button onClick={handleContinue} disabled={!name.trim()} loading={saving} size="lg" className="mt-8 w-full">
        Create my Pod
      </Button>
    </div>
  );
}
