"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function VisibilityToggle({ initiallyPublic }: { initiallyPublic: boolean }) {
  const [isPublic, setIsPublic] = useState(initiallyPublic);
  const [saving, setSaving] = useState(false);

  async function enableVisibility() {
    setSaving(true);
    try {
      const res = await fetch("/api/discover/visibility", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: true }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setIsPublic(true);
    } catch {
      // banner stays visible since the save didn't actually succeed
    } finally {
      setSaving(false);
    }
  }

  if (isPublic) return null;

  return (
    <div className="m-3.5 flex items-center gap-3 rounded-2xl bg-red-light px-3.5 py-3 lg:mx-6 lg:mt-5 lg:px-5 lg:py-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white lg:size-11">
        <Eye className="size-4 text-red lg:size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-bold text-ink lg:text-[14px]">
          You&apos;re not visible to other donors
        </p>
        <p className="text-[10px] text-ink-mid lg:text-[12px]">
          Opt in so people searching nearby can find you.
        </p>
      </div>
      <Button onClick={enableVisibility} loading={saving} size="sm" className="shrink-0">
        Make me visible
      </Button>
    </div>
  );
}
