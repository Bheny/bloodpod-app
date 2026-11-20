import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Gold with dark text is allowed for Captain badges and nowhere else in the app: it marks a Pod
 * Leader's recognition. #FFD700 on #1C1C1E is well over 4.5:1.
 */
export function CaptainBadge({ title, size = "sm", className }: { title: string; size?: "sm" | "md"; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full bg-[#FFD700] font-bold text-[#1C1C1E]",
        size === "sm" ? "px-2 py-0.5 text-label" : "px-3 py-1.5 text-caption",
        className,
      )}
      title={title}
    >
      <ShieldCheck className={size === "sm" ? "size-3" : "size-4"} aria-hidden />
      {title}
    </span>
  );
}
