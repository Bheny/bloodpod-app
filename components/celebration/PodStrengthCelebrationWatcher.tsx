"use client";

import { useEffect, useRef, useState } from "react";
import { CelebrationOverlay } from "@/components/celebration/CelebrationOverlay";
import { POD_STRENGTH_CELEBRATIONS } from "@/lib/pod-strength-copy";
import type { PodStrengthStep } from "@/lib/pod-strength";

function storageKey(userId: string) {
  return `bloodpod:celebrated-steps:${userId}`;
}

function readCelebrated(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function writeCelebrated(userId: string, ids: Set<string>) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify([...ids]));
  } catch {
    // localStorage can be unavailable (private mode, quota) - celebration is cosmetic only
  }
}

export function PodStrengthCelebrationWatcher({
  userId,
  steps,
}: {
  userId: string;
  steps: PodStrengthStep[];
}) {
  const [queue, setQueue] = useState<PodStrengthStep[]>([]);
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    const celebrated = readCelebrated(userId);
    const newlyComplete = steps.filter((s) => s.complete && !celebrated.has(s.id));
    if (newlyComplete.length === 0) return;

    newlyComplete.forEach((s) => celebrated.add(s.id));
    writeCelebrated(userId, celebrated);
    setQueue(newlyComplete);
  }, [userId, steps]);

  const current = queue[0];
  if (!current) return null;

  const copy = POD_STRENGTH_CELEBRATIONS[current.id];
  if (!copy) return null;

  return (
    <CelebrationOverlay
      key={current.id}
      title={copy.title}
      subtitle={copy.subtitle}
      icon={copy.icon}
      onDismiss={() => setQueue((q) => q.slice(1))}
    />
  );
}
