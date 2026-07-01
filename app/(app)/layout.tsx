import { BottomNav } from "@/components/layout/BottomNav";
import { Sidebar } from "@/components/layout/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <main className="pb-20 lg:pb-0 lg:pl-60">
        <div className="lg:mx-auto lg:max-w-220 lg:px-8 lg:py-8">
          <div className="lg:overflow-hidden lg:rounded-card lg:border-[0.5px] lg:border-[#E5E5EA] lg:shadow-sm">
            {children}
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
