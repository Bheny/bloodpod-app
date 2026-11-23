export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  // On a wide screen the steps sit in a centred card on a soft backdrop; on a phone the card fills the screen.
  return <div className="min-h-screen bg-card lg:bg-surface">{children}</div>;
}
