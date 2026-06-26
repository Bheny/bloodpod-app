import { cn } from "@/lib/utils";

export function BloodTypeBadge({
  bloodType,
  size = "md",
  className,
}: {
  bloodType: string | null;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-ink font-extrabold text-white",
        size === "sm" ? "size-6 text-[9px]" : "size-9 text-xs",
        className,
      )}
    >
      {bloodType ?? "—"}
    </span>
  );
}
