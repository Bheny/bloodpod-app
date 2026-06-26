"use client";

import { useState } from "react";
import Link from "next/link";
import { CreditCard, FileText, Plus } from "lucide-react";
import type { IdCard, Document } from "@prisma/client";
import { CardItem } from "@/components/essentials/CardItem";
import { DocumentItem } from "@/components/essentials/DocumentItem";
import { cn } from "@/lib/utils";

export function EssentialsTabs({ cards, documents }: { cards: IdCard[]; documents: Document[] }) {
  const [tab, setTab] = useState<"cards" | "documents">("cards");

  return (
    <div>
      <div className="flex gap-2 bg-white px-4 pb-3">
        <button
          type="button"
          onClick={() => setTab("cards")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-[11px] font-bold transition-colors",
            tab === "cards" ? "bg-red text-white" : "bg-surface text-ink-muted",
          )}
        >
          <CreditCard className="size-3.5" />
          My Cards
        </button>
        <button
          type="button"
          onClick={() => setTab("documents")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-[11px] font-bold transition-colors",
            tab === "documents" ? "bg-red text-white" : "bg-surface text-ink-muted",
          )}
        >
          <FileText className="size-3.5" />
          My Documents
        </button>
      </div>

      <div className="px-4 py-3">
        {tab === "cards" ? (
          cards.length === 0 ? (
            <EmptyState label="No ID cards saved yet." />
          ) : (
            <div className="divide-y-[0.5px] divide-surface overflow-hidden rounded-2xl border-[0.5px] border-[#E5E5EA] bg-white">
              {cards.map((card) => (
                <CardItem key={card.id} card={card} />
              ))}
            </div>
          )
        ) : documents.length === 0 ? (
          <EmptyState label="No documents saved yet." />
        ) : (
          <div className="divide-y-[0.5px] divide-surface overflow-hidden rounded-2xl border-[0.5px] border-[#E5E5EA] bg-white">
            {documents.map((document) => (
              <DocumentItem key={document.id} document={document} />
            ))}
          </div>
        )}

        <Link
          href={tab === "cards" ? "/essentials/cards/new" : "/essentials/documents/new"}
          className="mt-3 flex items-center justify-center gap-1.5 rounded-full bg-red py-3 text-[11px] font-bold text-white"
        >
          <Plus className="size-4" />
          {tab === "cards" ? "Add a card" : "Add a document"}
        </Link>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-2xl bg-white px-6 py-10 text-center">
      <p className="text-sm font-bold text-ink">{label}</p>
      <p className="mt-1 text-xs text-ink-muted">
        Add one below for easy access and sharing when you need it.
      </p>
    </div>
  );
}
