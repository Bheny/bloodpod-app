import { cn } from "@/lib/utils";

/** The standard surface: white, hairline border, soft shadow. */
export function Card({
  className,
  children,
  as: Tag = "section",
}: {
  className?: string;
  children: React.ReactNode;
  as?: "section" | "div" | "article";
}) {
  return (
    <Tag className={cn("rounded-2xl border-[0.5px] border-hairline bg-card p-4 shadow-raised lg:p-6", className)}>
      {children}
    </Tag>
  );
}

export function CardTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-body-sm font-bold text-ink lg:text-title">{children}</h2>
      {aside}
    </div>
  );
}
