import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminBadges } from "@/lib/admin/metrics";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: "Admin | BloodPod",
  robots: { index: false, follow: false },
};

// Never cache admin pages: the numbers must be live.
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // The layout is not re-run on client navigation, so every admin page checks access itself too.
  const admin = await requireAdmin();
  const badges = await getAdminBadges();

  return (
    <AdminShell email={admin.email} badges={badges}>
      {children}
    </AdminShell>
  );
}
