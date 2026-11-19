"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const IDEAS = ["Family", "Church", "Friends", "Work"];

export function CreatePodCard({ owned, limit }: { owned: number; limit: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (owned >= limit) {
    return (
      <p className="rounded-2xl border-[0.5px] border-dashed border-hairline px-4 py-4 text-center text-caption text-ink-muted">
        You own {owned} of {limit} Pods, the most your plan allows. Delete one to make room.
      </p>
    );
  }

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

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-red-mid bg-red-light/40 px-4 py-4 text-body-sm font-bold text-red transition-colors hover:bg-red-light"
      >
        <Plus className="size-4" /> Create another Pod
        <span className="text-caption font-semibold text-ink-muted">
          {owned} of {limit}
        </span>
      </button>
    );
  }

  return (
    <form onSubmit={create} className="rounded-2xl border-[0.5px] border-hairline bg-white p-4 shadow-raised lg:p-5">
      <p className="text-body-sm font-bold text-ink">Name your new Pod</p>
      <p className="mt-0.5 text-caption text-ink-muted">One for each group you trust: family, church, friends.</p>
      <Input
        autoFocus
        className="mt-3"
        placeholder="e.g. Mensah Family"
        value={name}
        maxLength={60}
        onChange={(e) => setName(e.target.value)}
      />
      <div className="mt-2 flex flex-wrap gap-1.5">
        {IDEAS.map((idea) => (
          <button
            key={idea}
            type="button"
            onClick={() => setName((n) => n || idea)}
            className="rounded-full bg-surface px-3 py-1 text-label font-bold text-ink-mid hover:bg-hairline"
          >
            {idea}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-caption text-red">{error}</p>}
      <div className="mt-3 flex gap-2">
        <Button type="submit" loading={busy} disabled={name.trim().length < 2} className="flex-1">
          Create Pod
        </Button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full bg-surface px-5 text-body-sm font-semibold text-ink-mid hover:bg-hairline"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
