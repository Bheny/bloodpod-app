import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getUserBookings } from "@/lib/bookings";
import { AppHeader } from "@/components/layout/AppHeader";
import { MyBookings } from "@/components/services/MyBookings";

export default async function MyBookingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user.hospitalId) redirect("/hospital");
  if (user.labId) redirect("/lab");
  if (!user.onboardingComplete) redirect("/onboarding");

  const bookings = await getUserBookings(user.id);

  return (
    <div>
      <AppHeader wide title="My bookings" subtitle="Test requests you've sent to labs" backHref="/services" />
      <MyBookings
        bookings={bookings.map((b) => ({
          id: b.id,
          status: b.status,
          testName: b.testName,
          labName: b.lab.name,
          labTown: b.lab.town,
          labPhone: b.lab.phone,
          preferredDate: b.preferredDate?.toISOString() ?? null,
          scheduledFor: b.scheduledFor?.toISOString() ?? null,
          labNote: b.labNote,
        }))}
      />
    </div>
  );
}
