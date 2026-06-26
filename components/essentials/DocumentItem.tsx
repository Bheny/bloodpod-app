import Link from "next/link";
import { FileText, ChevronRight } from "lucide-react";
import type { Document } from "@prisma/client";
import { formatDate } from "@/lib/formatters";

const TYPE_LABELS: Record<Document["type"], string> = {
  MEDICAL_RECORD: "Medical record",
  INSURANCE: "Insurance",
  VACCINATION: "Vaccination",
  PRESCRIPTION: "Prescription",
  LAB_RESULT: "Lab result",
  OTHER: "Other",
};

export function DocumentItem({ document }: { document: Document }) {
  return (
    <Link
      href={`/essentials/documents/${document.id}`}
      className="flex items-center gap-3 px-3.5 py-3 transition-colors duration-150 hover:bg-surface"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-red-light">
        <FileText className="size-4 text-red" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-bold text-ink">{document.title}</p>
        <p className="truncate text-[10px] text-ink-muted">
          {TYPE_LABELS[document.type]}
          {document.documentDate && ` · ${formatDate(document.documentDate)}`}
        </p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-ink-faint" />
    </Link>
  );
}
