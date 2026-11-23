"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

const pill =
  "flex min-h-11 w-full items-center justify-center rounded-full bg-red px-5 text-body-sm font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-50 motion-reduce:transition-none";

async function post(url: string, body?: unknown): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { ok: res.ok, data: (await res.json().catch(() => ({}))) as Record<string, unknown> };
}

/** Starts a practice alert for the leader's own Pod. */
export function DrillButton({ podId }: { podId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    const { ok, data } = await post("/api/readiness/drills", { podId });
    if (ok) router.push(`/pod/ready/drill/${data.id as string}`);
    else {
      setError((data.error as string) ?? "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={start} disabled={busy} className={pill}>
        {busy ? "Sending..." : "Run a drill"}
      </button>
      <p className="mt-2 text-caption text-ink-muted">A practice alert, clearly marked as a drill. Your Pod has 10 minutes to say they are here.</p>
      {error && <p role="alert" className="mt-2 text-caption text-red-fg">{error}</p>}
    </div>
  );
}

/** What a member sees when a drill reaches them. */
export function DrillResponder({ drillId, podName }: { drillId: string; podName: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "late">("idle");
  const [seconds, setSeconds] = useState(0);

  async function answer() {
    setState("busy");
    const { ok, data } = await post(`/api/readiness/drills/${drillId}/respond`);
    if (ok) {
      setSeconds((data.secondsToRespond as number) ?? 0);
      setState("done");
    } else setState("late");
  }

  if (state === "done") {
    return (
      <div className="text-center">
        <CheckCircle2 className="mx-auto size-10 text-success-strong" aria-hidden />
        <p className="mt-3 text-title font-extrabold text-ink">Thank you, you are here</p>
        <p className="mt-1 text-caption text-ink-muted">You answered in {seconds} seconds. That is all a drill needs.</p>
      </div>
    );
  }
  if (state === "late") {
    return <p className="text-center text-body-sm text-ink-mid">This drill has ended. Thank you for being ready.</p>;
  }
  return (
    <div className="text-center">
      <p className="text-title font-extrabold text-ink">Practice alert</p>
      <p className="mx-auto mt-1 max-w-xs text-body-sm text-ink-mid">
        {podName} is checking it could answer fast. This is only a drill: nobody needs blood.
      </p>
      <button type="button" onClick={answer} disabled={state === "busy"} className={`${pill} mt-5`}>
        {state === "busy" ? "Saving..." : "I am here"}
      </button>
    </div>
  );
}

/** Keeps the result screen fresh while the drill is still open. */
export function AutoRefresh({ every = 10_000 }: { every?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), every);
    return () => clearInterval(id);
  }, [router, every]);
  return null;
}

/** Start a Pod from the people you invited. They each still have to accept. */
export function SpinoffForm({ podId, podName, count }: { podId: string; podName: string; count: number }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { ok, data } = await post("/api/readiness/spinoff", { podId, name });
    if (ok) router.push(`/pod/${data.podId as string}`);
    else {
      setError((data.error as string) ?? "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label htmlFor={`spin-${podId}`} className="block text-caption font-semibold text-ink-mid">
        Name your new Pod
      </label>
      <input
        id={`spin-${podId}`}
        value={name}
        onChange={(e) => setName(e.target.value)}
        minLength={2}
        maxLength={60}
        required
        placeholder={`For example: Friends from ${podName}`}
        className="min-h-11 w-full rounded-xl border border-hairline bg-card px-3 text-body-sm text-ink focus:border-red focus:outline-none"
      />
      <button type="submit" disabled={busy} className={pill}>
        {busy ? "Starting..." : "Start a Pod from your invites"}
      </button>
      <p className="text-caption text-ink-muted">
        The {count} people you invited get an invitation. Nobody is added until they say yes.
      </p>
      {error && <p role="alert" className="text-caption text-red-fg">{error}</p>}
    </form>
  );
}
