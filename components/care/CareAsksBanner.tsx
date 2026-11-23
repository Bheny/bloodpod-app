import Link from "next/link";
import { ChevronRight, HandHeart } from "lucide-react";

/** Shown to a donor when someone in their Pods has asked them to give on a date. */
export function CareAsksBanner({ waiting }: { waiting: number }) {
  if (waiting < 1) return null;
  return (
    <Link
      href="/care/requests"
      className="flex min-h-14 items-center gap-3 rounded-3xl bg-red-light px-4 py-3 transition-transform active:scale-[0.99] lg:rounded-2xl"
    >
      <HandHeart className="size-5 shrink-0 text-red-fg" aria-hidden />
      <span className="min-w-0 flex-1 text-body-sm font-bold text-red-fg">
        {waiting === 1 ? "Someone in your Pod asked for your help" : `${waiting} people in your Pods asked for your help`}
      </span>
      <ChevronRight className="size-4 shrink-0 text-red-fg" aria-hidden />
    </Link>
  );
}
