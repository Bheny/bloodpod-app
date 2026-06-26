import { LogoMark } from "@/components/ui/Logo";
import { AppHeader } from "@/components/layout/AppHeader";

export function ComingSoon({
  title,
  subtitle,
  backHref,
}: {
  title: string;
  subtitle: string;
  backHref?: string;
}) {
  return (
    <div>
      <AppHeader title={title} backHref={backHref} />
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <LogoMark className="size-10 opacity-30" />
        <p className="text-sm font-bold text-ink">Coming soon</p>
        <p className="max-w-xs text-xs text-ink-muted">{subtitle}</p>
      </div>
    </div>
  );
}
