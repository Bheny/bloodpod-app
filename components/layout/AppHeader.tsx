import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The one page header. On phones it is a large title with no bar, the same as the home screen.
 * On desktop a `wide` page shows a large title, while other pages keep a bar inside their card.
 */
export function AppHeader({
  title,
  subtitle,
  backHref,
  actions,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  actions?: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <header
      className={cn(
        "flex items-end gap-3 px-4 pb-2 pt-5",
        wide
          ? "lg:items-center lg:border-0 lg:bg-transparent lg:px-0 lg:pb-6 lg:pt-0"
          : "lg:items-center lg:border-b-[0.5px] lg:border-hairline lg:bg-card lg:px-6 lg:py-5",
      )}
    >
      {backHref && (
        <Link
          href={backHref}
          aria-label="Back"
          className="mb-1 flex size-10 shrink-0 items-center justify-center rounded-full bg-card shadow-raised transition-transform active:scale-95 lg:mb-0 lg:size-9 lg:bg-surface lg:shadow-none lg:hover:bg-hairline"
        >
          <ArrowLeft className="size-4 text-ink" />
        </Link>
      )}
      <div className="min-w-0 flex-1">
        <h1
          className={cn(
            "truncate font-extrabold leading-[1.05] text-ink",
            backHref ? "text-[28px] tracking-[-1px]" : "text-[34px] tracking-[-1.2px]",
            wide ? "lg:text-[30px] lg:tracking-[-1px]" : "lg:text-[22px] lg:tracking-[-0.6px]",
          )}
        >
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-caption leading-snug text-ink-muted lg:mt-0.5 lg:truncate lg:text-body-sm">{subtitle}</p>}
      </div>
      {actions && <div className="mb-1 flex shrink-0 items-center gap-2 lg:mb-0">{actions}</div>}
    </header>
  );
}
