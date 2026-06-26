import { cn } from "@/lib/utils";

export type StatusDotColor = "green" | "amber" | "grey";

const COLORS: Record<StatusDotColor, string> = {
  green: "#34C759",
  amber: "#F59E0B",
  grey: "#C7C7CC",
};

export function StatusDot({ status, className }: { status: StatusDotColor; className?: string }) {
  return (
    <span
      className={cn("inline-block size-1.5 rounded-full", className)}
      style={{ backgroundColor: COLORS[status] }}
    />
  );
}
