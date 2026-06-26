import { LogoMark } from "@/components/ui/Logo";

export default function OnboardingLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3">
      <LogoMark className="size-10 animate-pulse" />
      <div className="size-5 animate-spin rounded-full border-2 border-red-mid border-t-red" />
    </div>
  );
}
