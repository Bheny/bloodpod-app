import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, id, rows = 3, ...props }, ref) => {
    return (
      <textarea
        id={id}
        ref={ref}
        rows={rows}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          "w-full resize-none rounded-xl border bg-white px-4 py-3.5 text-base text-ink placeholder:text-ink-faint transition-colors duration-150",
          "focus:outline-none focus:border-red focus:ring-3 focus:ring-red/8",
          error ? "border-red bg-[#FFF8F8]" : "border-[#E5E5EA]",
          className,
        )}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
