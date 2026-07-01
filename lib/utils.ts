import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// tailwind-merge doesn't know about our custom `--text-*` type-scale tokens
// (globals.css) and was bucketing them into the text-color conflict group,
// silently dropping real color classes like `text-white` whenever both
// appeared in the same cn() call. Registering them under font-size fixes it.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        "text-display",
        "text-title-lg",
        "text-title",
        "text-body",
        "text-body-sm",
        "text-caption",
        "text-label",
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const cardHover =
  "transition-all duration-200 ease-out hover:-translate-y-1.5 hover:border-red hover:shadow-[0_20px_40px_-16px_rgba(221,0,0,0.22)]";
