"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

const KINDS = ["Family", "Church", "Office", "School", "Gym"];
const MAX_LENGTH = 60;

function suggestName(firstName: string | null, kind: string) {
  return `${firstName ? `${firstName}'s ` : "My "}${kind} Pod`.slice(0, MAX_LENGTH);
}

export function CreatePodCard({
  owned,
  limit,
  firstName = null,
  variant = "row",
}: {
  owned: number;
  limit: number;
  /** Used to suggest names like "Ama's Family Pod". */
  firstName?: string | null;
  /** "slide" is the tall dashed card used at the end of the dashboard carousel. */
  variant?: "row" | "slide";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // Opens with the first group already suggested; the pills swap it and the field stays editable.
  const [name, setName] = useState(() => suggestName(firstName, KINDS[0]));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Every donor leads one Pod. Once they have it, there is nothing to create: they add people to it instead.
  if (owned >= limit) return null;

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/pods/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't create the Pod. Try again.");
      router.push(`/pod/${data.podId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create the Pod. Try again.");
      setBusy(false);
    }
  }

  const trigger =
    variant === "slide" ? (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-full min-h-[176px] w-full flex-col items-center justify-center gap-2 rounded-3xl border-[1.5px] border-dashed border-ink-faint/60 bg-card/60 p-4 text-center transition-colors hover:bg-card lg:p-6"
      >
        <span className="flex size-11 items-center justify-center rounded-full bg-red-light text-red-fg">
          <Plus className="size-6" />
        </span>
        <span className="text-body-sm font-bold text-ink">Start your Pod</span>
        <span className="max-w-[220px] text-caption text-ink-muted">
          The people you trust to answer when blood is needed.
        </span>
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-3xl border-[1.5px] border-dashed border-red-mid bg-red-light/40 px-4 py-4 text-body-sm font-bold text-red-fg transition-colors hover:bg-red-light"
      >
        <Plus className="size-4" /> Start your Pod
      </button>
    );

  return (
    <>
      {trigger}
      <Modal open={open} onClose={() => !busy && setOpen(false)}>
        <form onSubmit={create}>
          <p className="pr-10 text-title font-bold text-ink">Name your Pod</p>
          <p className="mt-0.5 text-caption text-ink-muted">Pick a group for a ready-made name, or type your own.</p>
          <Input
            autoFocus
            className="mt-4"
            placeholder="e.g. Mensah Family"
            value={name}
            maxLength={MAX_LENGTH}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {KINDS.map((k) => {
              const suggestion = suggestName(firstName, k);
              const picked = name === suggestion;
              return (
                <button
                  key={k}
                  type="button"
                  aria-pressed={picked}
                  onClick={() => setName(suggestion)}
                  className={
                    picked
                      ? "rounded-full bg-panel px-3 py-1 text-label font-bold text-white"
                      : "rounded-full bg-surface px-3 py-1 text-label font-bold text-ink-mid hover:bg-hairline"
                  }
                >
                  {k}
                </button>
              );
            })}
          </div>
          {error && <p className="mt-2 text-caption text-red-fg">{error}</p>}
          <div className="mt-4 flex gap-2">
            <Button type="submit" loading={busy} disabled={name.trim().length < 2} className="flex-1">
              Create Pod
            </Button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={busy}
              className="rounded-full bg-surface px-5 text-body-sm font-semibold text-ink-mid hover:bg-hairline"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
