import { Skeleton } from "@/components/ui/Skeleton";
import { Logo } from "@/components/ui/Logo";

export default function InviteLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-[400px] rounded-3xl border-[0.5px] border-[#E5E5EA] bg-white p-6">
        <div className="flex justify-center opacity-40">
          <Logo />
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-2 w-24" />
            <Skeleton className="mt-1.5 h-3 w-32" />
          </div>
        </div>

        <Skeleton className="mt-5 h-6 w-3/4" />
        <Skeleton className="mt-2 h-2.5 w-1/2" />

        <div className="mt-4 flex -space-x-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="size-7 rounded-full border-2 border-white" />
          ))}
        </div>

        <Skeleton className="mt-5 h-12 rounded-full" />
      </div>
    </div>
  );
}
