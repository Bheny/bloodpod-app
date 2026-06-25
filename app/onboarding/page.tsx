import { Logo } from "@/components/ui/Logo";

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center gap-6 bg-surface px-4 text-center">
      <Logo />
      <div className="size-8 animate-spin rounded-full border-2 border-red-mid border-t-red" />
      <h1 className="text-xl font-bold text-ink">Your pod is being created...</h1>
      <p className="max-w-sm text-sm text-ink-muted">
        We&apos;re setting up your first pod. This will only take a moment.
      </p>
    </div>
  );
}
