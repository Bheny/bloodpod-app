"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Top-level screens are real multi-column layouts on desktop and use the full
// width. Forms and detail pages keep a narrower bordered card.
const WIDE_ROUTES = ["/dashboard", "/pod", "/passport", "/profile", "/discover", "/services"];

function isWide(pathname: string) {
  // /pod/<id> is a Pod's detail page. Its invite and settings pages stay in the narrow card.
  return WIDE_ROUTES.includes(pathname) || /^\/pod\/(?!invite$|settings$)[^/]+$/.test(pathname);
}

export function AppFrame({ children }: { children: React.ReactNode }) {
  const wide = isWide(usePathname());

  return (
    <main className="pb-20 lg:pb-0 lg:pl-60">
      <div className={cn("lg:mx-auto lg:px-8 lg:py-8", wide ? "lg:max-w-[1180px]" : "lg:max-w-220")}>
        <div
          className={cn(
            !wide && "lg:overflow-hidden lg:rounded-card lg:border-[0.5px] lg:border-[#E5E5EA] lg:shadow-sm",
          )}
        >
          {children}
        </div>
      </div>
    </main>
  );
}
