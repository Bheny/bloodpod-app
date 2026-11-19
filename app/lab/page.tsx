import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getLabInbox } from "@/lib/bookings";
import { prisma } from "@/lib/prisma";
import { LabHeader } from "@/components/lab/LabHeader";
import { LabInbox } from "@/components/lab/LabInbox";

export default async function LabPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  // Everyone who isn't lab staff gets a plain 404, so the portal isn't discoverable.
  if (!user.labId) notFound();

  const [lab, bookings] = await Promise.all([
    prisma.lab.findUnique({ where: { id: user.labId }, select: { name: true } }),
    getLabInbox(user.labId),
  ]);
  if (!lab) notFound();

  return (
    <>
      <LabHeader labName={lab.name} />
      <main className="mx-auto max-w-[1100px] px-4 py-6 lg:px-6 lg:py-8">
        <h1 className="text-[26px] font-extrabold leading-tight tracking-[-0.8px] text-ink">Requests</h1>
        <p className="mt-1 text-body-sm text-ink-muted">
          People who asked {lab.name} for a test. Reply to each one so they know what to do.
        </p>
        <LabInbox
          bookings={bookings.map((b) => ({
            id: b.id,
            status: b.status,
            testName: b.testName,
            personName: b.user.name,
            personPhone: b.user.phone,
            preferredDate: b.preferredDate?.toISOString() ?? null,
            scheduledFor: b.scheduledFor?.toISOString() ?? null,
            note: b.note,
            labNote: b.labNote,
            createdAt: b.createdAt.toISOString(),
          }))}
        />
      </main>
    </>
  );
}
