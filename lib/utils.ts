import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const cardHover =
  "transition-all duration-200 ease-out hover:-translate-y-1.5 hover:border-red hover:shadow-[0_20px_40px_-16px_rgba(221,0,0,0.22)]";
