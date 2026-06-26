import Link from "next/link";
import { CreditCard, ChevronRight } from "lucide-react";
import type { IdCard } from "@prisma/client";
import { formatDate } from "@/lib/formatters";

const TYPE_LABELS: Record<IdCard["type"], string> = {
  NATIONAL_ID: "National ID",
  NHIS: "NHIS",
  VOTER_ID: "Voter ID",
  DRIVERS_LICENSE: "Driver's licence",
  PASSPORT: "Passport",
  STUDENT_ID: "Student ID",
  OTHER: "Other",
};

export function CardItem({ card }: { card: IdCard }) {
  const label = card.type === "OTHER" && card.label ? card.label : TYPE_LABELS[card.type];

  return (
    <Link
      href={`/essentials/cards/${card.id}`}
      className="flex items-center gap-3 px-3.5 py-3 transition-colors duration-150 hover:bg-surface"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-red-light">
        <CreditCard className="size-4 text-red" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-bold text-ink">{label}</p>
        <p className="truncate text-[10px] text-ink-muted">
          {card.cardNumber ? `•••• ${card.cardNumber.slice(-4)}` : "No card number"}
          {card.expiryDate && ` · Expires ${formatDate(card.expiryDate)}`}
        </p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-ink-faint" />
    </Link>
  );
}
