import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The one page header. On phones it is a bar; on desktop a `wide` page drops
 * the bar and shows a large title, while other pages keep a bar inside their card.
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
        "flex items-center gap-3 border-b-[0.5px] border-hairline bg-white px-4 py-3.5",
        wide ? "lg:border-0 lg:bg-transparent lg:px-0 lg:pb-6 lg:pt-0" : "lg:px-6 lg:py-5",
      )}
    >
      {backHref && (
        <Link
          href={backHref}
          aria-label="Back"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface transition-colors hover:bg-hairline"
        >
          <ArrowLeft className="size-4 text-ink" />
        </Link>
      )}
      <div className="min-w-0 flex-1">
        <h1
          className={cn(
            "truncate text-[19px] font-extrabold leading-tight tracking-[-0.6px] text-ink",
            wide ? "lg:text-[30px] lg:tracking-[-1px]" : "lg:text-[22px]",
          )}
        >
          {title}
        </h1>
        {subtitle && <p className="mt-0.5 truncate text-caption text-ink-muted lg:text-body-sm">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
