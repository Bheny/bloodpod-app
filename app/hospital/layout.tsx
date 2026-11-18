// The hospital area is desktop-first, unlike the donor app.
export default function HospitalLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-surface">{children}</div>;
}
