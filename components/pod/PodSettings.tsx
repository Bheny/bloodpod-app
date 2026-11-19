"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface SettingsMember {
  id: string;
  name: string;
  bloodType: string | null;
}

export function PodSettings({
  podId,
  podName,
  viewerId,
  isOwner,
  members,
  canDelete,
}: {
  podId: string;
  podName: string;
  viewerId: string;
  isOwner: boolean;
  /** Everyone except the owner. */
  members: SettingsMember[];
  /** An owner can't delete their only Pod. */
  canDelete: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(podName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [list, setList] = useState(members);
  const [confirm, setConfirm] = useState<"leave" | "delete" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function call(url: string, init: RequestInit) {
    const res = await fetch(url, init);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Something went wrong. Please try again.");
    }
  }

  async function rename(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await call(`/api/pods/${podId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(member: SettingsMember) {
    setBusy(true);
    setError(null);
    try {
      await call(`/api/pods/${podId}/members/${member.id}`, { method: "DELETE" });
      setList((l) => l.filter((m) => m.id !== member.id));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function leave(selfId: string) {
    setBusy(true);
    setError(null);
    try {
      await call(`/api/pods/${podId}/members/${selfId}`, { method: "DELETE" });
      router.push("/pod");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  async function deletePod() {
    setBusy(true);
    setError(null);
    try {
      await call(`/api/pods/${podId}`, { method: "DELETE" });
      router.push("/pod");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3.5 p-3.5 lg:p-6">
      {isOwner && (
        <Card>
          <CardTitle>Pod name</CardTitle>
          <form onSubmit={rename} className="mt-3 flex gap-2">
            <Input value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
            <Button type="submit" loading={saving} disabled={name.trim().length < 2 || name.trim() === podName}>
              Save
            </Button>
          </form>
          {saved && <p className="mt-2 text-caption text-ink-muted">Saved.</p>}
        </Card>
      )}

      {isOwner && (
        <Card>
          <CardTitle>Members</CardTitle>
          {list.length === 0 ? (
            <p className="mt-2 text-caption text-ink-muted">Nobody else is in this Pod yet.</p>
          ) : (
            <ul className="mt-2 divide-y-[0.5px] divide-hairline">
              {list.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-body-sm font-semibold text-ink">{m.name}</p>
                    <p className="text-caption text-ink-muted">{m.bloodType ?? "Blood type not set"}</p>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => remove(m)}
                    className="rounded-full bg-surface px-3.5 py-1.5 text-caption font-bold text-red hover:bg-red-light disabled:opacity-60"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <Card>
        <CardTitle>{isOwner ? "Delete this Pod" : "Leave this Pod"}</CardTitle>
        <p className="mt-1 text-caption text-ink-muted">
          {isOwner
            ? canDelete
              ? "Removes the Pod, its members and its invite links. This can't be undone."
              : "This is your only Pod, so it can't be deleted. You can rename it above."
            : "You'll stop being part of this circle. You can rejoin if the owner invites you again."}
        </p>

        {(isOwner ? canDelete : true) &&
          (confirm ? (
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => (isOwner ? deletePod() : leave(viewerId))}
                className="flex-1 rounded-full bg-red py-2.5 text-body-sm font-bold text-white disabled:opacity-60"
              >
                {busy ? "Working..." : isOwner ? "Yes, delete it" : "Yes, leave"}
              </button>
              <button
                type="button"
                onClick={() => setConfirm(null)}
                className="rounded-full bg-surface px-5 text-body-sm font-semibold text-ink-mid hover:bg-hairline"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirm(isOwner ? "delete" : "leave")}
              className="mt-3 rounded-full border border-red-mid px-5 py-2.5 text-body-sm font-bold text-red hover:bg-red-light"
            >
              {isOwner ? "Delete Pod" : "Leave Pod"}
            </button>
          ))}
      </Card>

      {error && <p className="text-caption text-red">{error}</p>}
    </div>
  );
}

