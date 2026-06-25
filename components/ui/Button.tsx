import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-bold transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.96] disabled:opacity-60 disabled:pointer-events-none disabled:hover:scale-100 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-red/20",
  {
    variants: {
      variant: {
        primary:
          "bg-red text-white shadow-[0_0_0_0_rgba(221,0,0,0.4)] hover:bg-red-dark hover:shadow-[0_8px_24px_-4px_rgba(221,0,0,0.45)]",
        secondary:
          "bg-transparent border-[1.5px] border-red-mid text-red hover:bg-red-light font-bold",
        ghost: "bg-surface text-ink hover:bg-[#E5E5EA] font-semibold",
      },
      size: {
        default: "px-6 py-3 text-base",
        lg: "px-10 py-4 text-lg",
        sm: "px-4 py-2 text-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, loading = false, children, disabled, ...props },
    ref,
  ) => {
    if (asChild) {
      return (
        <Slot className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
          {children}
        </Slot>
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
