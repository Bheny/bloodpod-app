import type { ReactNode } from "react";

export function Carousel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-white py-3 lg:py-4">
      <p className="px-4 text-[13px] font-bold text-ink lg:px-6 lg:text-[16px]">{title}</p>
      <div className="no-scrollbar mt-2.5 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-1 lg:gap-3.5 lg:px-6">
        {children}
      </div>
    </div>
  );
}
