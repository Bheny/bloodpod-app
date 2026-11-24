"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { m } from "framer-motion";
import { MemberItem } from "@/components/pod/MemberItem";
import { MemberDetailModal } from "@/components/pod/MemberDetailModal";
import { SortPeople } from "@/components/pod/SortPeople";
import type { PodMemberView } from "@/lib/pod-data";
import { POD_CATEGORIES, POD_CATEGORY_LABELS, type PodCategoryId } from "@/lib/pod-categories";
import { cn } from "@/lib/utils";

/**
 * The people in a Pod. When the owner is looking (`podId` given), each person shows how the owner knows them,
 * the list can be filtered by it, and a person's category can be changed.
 */
export function MemberList({ members, podId }: { members: PodMemberView[]; podId?: string }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<PodCategoryId | "ALL">("ALL");
  // A category the owner just changed, shown straight away while the page catches up.
  const [changed, setChanged] = useState<Record<string, PodCategoryId>>({});

  const shown = useMemo(() => members.map((x) => (changed[x.id] ? { ...x, category: changed[x.id] } : x)), [members, changed]);
  const counts = useMemo(() => {
    const out = new Map<PodCategoryId, number>();
    for (const x of shown) if (x.category) out.set(x.category, (out.get(x.category) ?? 0) + 1);
    return out;
  }, [shown]);
  const sorted = podId && counts.size > 0; // chips only when the owner has people to sort
  const visible = filter === "ALL" ? shown : shown.filter((x) => x.category === filter);
  const selected = selectedId ? (shown.find((x) => x.id === selectedId) ?? null) : null;
  const others = [...counts.values()].reduce((a, b) => a + b, 0);

  // People still filed as Other. The list is frozen when "Sort" is opened, so rows do not jump as they are filed.
  const [sorting, setSorting] = useState<PodMemberView[] | null>(null);
  const unsorted = shown.filter((x) => !x.isOwner && x.category === "OTHER");

  const record = (id: string, category: PodCategoryId) => {
    setChanged((c) => ({ ...c, [id]: category }));
    router.refresh();
  };

  if (sorting && podId) {
    return <SortPeople people={sorting} podId={podId} onChanged={record} onClose={() => setSorting(null)} />;
  }

  return (
    <>
      {podId && unsorted.length > 0 && (
        <button
          type="button"
          onClick={() => setSorting(unsorted)}
          className="mx-4 mb-3 flex w-[calc(100%-2rem)] items-center justify-between gap-3 rounded-2xl bg-red-light px-4 py-3 text-left"
        >
          <span>
            <span className="block text-body-sm font-bold text-ink">
              {unsorted.length} {unsorted.length === 1 ? "person" : "people"} not sorted yet
            </span>
            <span className="block text-caption text-ink-muted">File them as Family, Friends, Church and more.</span>
          </span>
          <span className="shrink-0 text-body-sm font-bold text-red-fg">Sort</span>
        </button>
      )}

      {sorted && (
        <div className="flex gap-1.5 overflow-x-auto px-4 pb-3 [scrollbar-width:none]" role="tablist" aria-label="Filter by how you know them">
          <button
            type="button"
            role="tab"
            aria-selected={filter === "ALL"}
            onClick={() => setFilter("ALL")}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-caption font-bold",
              filter === "ALL" ? "bg-panel text-white" : "bg-surface text-ink-mid",
            )}
          >
            Everyone {shown.length}
          </button>
          {POD_CATEGORIES.filter((c) => counts.has(c)).map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={filter === c}
              onClick={() => setFilter(c)}
              className={cn("shrink-0 rounded-full px-3 py-1.5 text-caption font-bold", filter === c ? "bg-panel text-white" : "bg-surface text-ink-mid")}
            >
              {POD_CATEGORY_LABELS[c]} {counts.get(c)}
            </button>
          ))}
        </div>
      )}

      <div className="divide-y-[0.5px] divide-hairline">
        {visible.map((member, i) => (
          <m.div
            key={member.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04, duration: 0.25 }}
          >
            <MemberItem member={member} onSelect={(x) => setSelectedId(x.id)} />
          </m.div>
        ))}
        {visible.length === 0 && others > 0 && <p className="px-4 py-6 text-center text-caption text-ink-muted">Nobody here yet.</p>}
      </div>

      <MemberDetailModal
        member={selected}
        onClose={() => setSelectedId(null)}
        podId={podId}
        onCategory={record}
      />
    </>
  );
}
