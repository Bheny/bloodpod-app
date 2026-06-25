import { Logo } from "@/components/ui/Logo";

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center gap-4 bg-surface px-4 text-center">
      <Logo />
      <h1 className="text-xl font-bold text-ink">Dashboard coming in Phase 2</h1>
      <p className="max-w-sm text-sm text-ink-muted">
        Pod management, donor matching, and emergency alerts land next.
      </p>
    </div>
  );
}
