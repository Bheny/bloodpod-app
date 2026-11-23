"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

/** One tap a week: "I'm still here and available if my Pod needs me". Counts the week once. */
export function CheckIn({ done }: { done: boolean }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">(done ? "done" : "idle");

  async function tap() {
    setState("busy");
    const res = await fetch("/api/garden/tend", { method: "POST" }).catch(() => null);
    if (res?.ok) {
      setState("done");
      router.refresh();
    } else setState("error");
  }

  if (state === "done") {
    return (
      <p className="flex items-center justify-center gap-2 text-body-sm font-bold text-success-strong">
        <CheckCircle2 className="size-4" aria-hidden /> Tended this week
      </p>
    );
  }
  return (
    <div>
      <button
        type="button"
        onClick={tap}
        disabled={state === "busy"}
        className="flex min-h-11 w-full items-center justify-center rounded-full bg-red px-5 text-body-sm font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-50 motion-reduce:transition-none"
      >
        {state === "busy" ? "Saving..." : "I'm here and available this week"}
      </button>
      <p className="mt-2 text-center text-caption text-ink-muted">Tap once a week to say you would still answer if your Pod needed you.</p>
      {state === "error" && (
        <p role="alert" className="mt-2 text-center text-caption text-red-fg">
          That did not save. Try again.
        </p>
      )}
    </div>
  );
}
