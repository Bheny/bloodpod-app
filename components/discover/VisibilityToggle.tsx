"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function VisibilityToggle({ initiallyPublic }: { initiallyPublic: boolean }) {
  const [isPublic, setIsPublic] = useState(initiallyPublic);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  async function enableVisibility() {
    setSaving(true);
    setFailed(false);
    try {
      const res = await fetch("/api/discover/visibility", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: true }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setIsPublic(true);
    } catch {
      // The banner stays, and now says so, since the save didn't actually succeed.
      setFailed(true);
    } finally {
      setSaving(false);
    }
  }

  if (isPublic) return null;

  return (
    // Stacked on narrow phones (message on top, a full-width button underneath), side by side once there's room.
    <div className="m-3.5 flex flex-col gap-3 rounded-3xl border-[0.5px] border-hairline bg-card lg:rounded-2xl px-3.5 py-3.5 shadow-raised min-[480px]:flex-row min-[480px]:items-center lg:mx-6 lg:mt-5 lg:px-5 lg:py-4">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface lg:size-11">
          <Eye className="size-4 text-ink-mid lg:size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-body-sm font-bold text-ink">Your first name is hidden</p>
          <p className="mt-0.5 text-caption leading-snug text-ink-mid">
            People nearby can already see your blood type and rough area, without your name. Show your first name to let them ask you for help. You choose whether to answer, and nothing more is shared unless you say yes.
          </p>
          {failed && <p className="mt-1.5 text-caption font-semibold text-red-fg">Couldn&apos;t save that. Please try again.</p>}
        </div>
      </div>
      <Button
        onClick={enableVisibility}
        loading={saving}
        size="sm"
        className="w-full shrink-0 min-[480px]:w-auto"
      >
        Show my first name
      </Button>
    </div>
  );
}
