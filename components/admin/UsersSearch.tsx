"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { BLOOD_TYPE_LABELS } from "@/lib/blood-type";

const WAIT_MS = 350;

/**
 * The Users search. It updates the list as you type, but waits until you pause (so one request per
 * pause, not one per key). The Search button and Enter still work straight away.
 */
export function UsersSearch({ q, blood, status }: { q: string; blood: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [text, setText] = useState(q);
  const [type, setType] = useState(blood);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const last = useRef(`${q}|${blood}`);

  function go(nextText: string, nextType: string) {
    const key = `${nextText.trim()}|${nextType}`;
    if (key === last.current) return; // nothing new to ask for
    last.current = key;
    const params = new URLSearchParams();
    if (nextText.trim()) params.set("q", nextText.trim());
    if (nextType) params.set("blood", nextType);
    if (status && status !== "all") params.set("status", status);
    const qs = params.toString();
    startTransition(() => router.replace(`/admin/users${qs ? `?${qs}` : ""}`, { scroll: false }));
  }

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function onType(value: string) {
    setText(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => go(value, type), WAIT_MS);
  }

  return (
    <form
      method="get"
      action="/admin/users"
      className="flex flex-col gap-3 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        if (timer.current) clearTimeout(timer.current);
        go(text, type);
      }}
    >
      <div className="relative flex-1">
        {pending ? (
          <Loader2 className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 animate-spin text-ink-faint" aria-hidden />
        ) : (
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-faint" aria-hidden />
        )}
        <input
          name="q"
          value={text}
          onChange={(e) => onType(e.target.value)}
          placeholder="Search name, email, phone or city"
          aria-label="Search users"
          autoComplete="off"
          className="w-full rounded-xl border border-hairline bg-card py-3 pl-11 pr-4 text-body-sm text-ink placeholder:text-ink-faint focus:border-red focus:outline-none focus:ring-3 focus:ring-red/8"
        />
      </div>
      <select
        name="blood"
        value={type}
        onChange={(e) => {
          setType(e.target.value);
          if (timer.current) clearTimeout(timer.current);
          go(text, e.target.value);
        }}
        aria-label="Blood type"
        className="rounded-xl border border-hairline bg-card px-4 py-3 text-body-sm text-ink focus:border-red focus:outline-none"
      >
        <option value="">All blood types</option>
        {Object.entries(BLOOD_TYPE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      {status !== "all" && <input type="hidden" name="status" value={status} />}
      <button type="submit" className="rounded-xl bg-panel px-6 py-3 text-body-sm font-bold text-white">
        Search
      </button>
    </form>
  );
}
