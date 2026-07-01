import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function AppHeader({
  title,
  subtitle,
  backHref,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b-[0.5px] border-hairline bg-white px-4 py-3.5 lg:px-6 lg:py-5">
      {backHref && (
        <Link
          href={backHref}
          aria-label="Back"
          className="flex size-5.5 shrink-0 items-center justify-center rounded-full bg-surface lg:size-7"
        >
          <ArrowLeft className="size-3.5 text-ink lg:size-4" />
        </Link>
      )}
      <div>
        <h1 className="text-body-sm font-extrabold tracking-[-0.4px] text-ink lg:text-title">{title}</h1>
        {subtitle && <p className="text-label text-ink-muted">{subtitle}</p>}
      </div>
    </div>
  );
}
