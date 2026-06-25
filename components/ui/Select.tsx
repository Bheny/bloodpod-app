import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, id, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          id={id}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            "w-full appearance-none rounded-xl border bg-white px-4 py-3.5 text-base text-ink transition-colors duration-150",
            "focus:outline-none focus:border-red focus:ring-3 focus:ring-red/8",
            error ? "border-red bg-[#FFF8F8]" : "border-[#E5E5EA]",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute inset-y-0 right-4 my-auto size-4 text-ink-faint" />
      </div>
    );
  },
);
Select.displayName = "Select";

export { Select };
