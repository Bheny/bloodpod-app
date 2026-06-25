import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, id, ...props }, ref) => {
    return (
      <input
        id={id}
        ref={ref}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          "w-full rounded-xl border bg-white px-4 py-3.5 text-base text-ink placeholder:text-ink-faint transition-colors duration-150",
          "focus:outline-none focus:border-red focus:ring-3 focus:ring-red/8",
          error ? "border-red bg-[#FFF8F8]" : "border-[#E5E5EA]",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

const PasswordInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);

    return (
      <div className="relative">
        <Input ref={ref} type={visible ? "text" : "password"} className={cn("pr-12", className)} {...props} />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          tabIndex={-1}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-ink-faint hover:text-ink-muted"
        >
          {visible ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";

export interface FieldProps {
  label: string;
  id: string;
  error?: string;
  children: React.ReactNode;
}

export function Field({ label, id, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-ink-mid">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-xs text-red">
          {error}
        </p>
      )}
    </div>
  );
}

export { Input, PasswordInput };
