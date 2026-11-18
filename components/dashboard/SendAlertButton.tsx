import Link from "next/link";
import { BellRing } from "lucide-react";
import { cn } from "@/lib/utils";

// "Send family alert" is the one primary action in the donor app. On phones it
// floats above the tab bar; on desktop it sits in the sidebar and the side rail.
export function SendAlertButton({
  variant,
  className,
}: {
  variant: "fab" | "block";
  className?: string;
}) {
  return (
    <Link
      href="/dashboard/request"
      className={cn(
        "flex items-center justify-center gap-2 bg-red font-bold text-white transition-transform duration-150 active:scale-95",
        variant === "fab"
          ? "fixed right-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 rounded-full px-5 py-3.5 text-body-sm shadow-[0_12px_28px_-6px_rgba(221,0,0,0.55)] lg:hidden"
          : "rounded-full px-5 py-3 text-body-sm hover:bg-red-dark",
        className,
      )}
    >
      <BellRing className="size-4" />
      Send family alert
    </Link>
  );
}
