// The lab portal is desktop-first, like the hospital area, and works fine on a phone.
export default function LabLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-surface">{children}</div>;
}
