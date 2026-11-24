import { adb as prisma } from "@/lib/admin/db";
import type { ReasonId } from "@/lib/report-rules";

export interface ReportedPerson {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  city: string | null;
  heldAt: Date | null;
  heldReason: string | null;
  onboardingComplete: boolean;
  createdAt: Date;
  /** Open reports first-hand, newest first. */
  reports: { id: string; reason: ReasonId; note: string | null; reporterId: string; reporter: string; at: Date }[];
  reporters: number;
  lastContacted: { at: Date; template: string; by: string } | null;
}

/** People with open reports against them, the most-reported first. Reporter names are for admins only. */
export async function getReportQueue(): Promise<ReportedPerson[]> {
  const open = await prisma.userReport.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    take: 300,
    select: {
      id: true,
      reason: true,
      note: true,
      createdAt: true,
      reporterId: true,
      reporter: { select: { name: true, email: true } },
      reported: {
        select: { id: true, name: true, email: true, phone: true, city: true, heldAt: true, heldReason: true, onboardingComplete: true, createdAt: true },
      },
    },
  });

  const byPerson = new Map<string, ReportedPerson>();
  for (const r of open) {
    const p =
      byPerson.get(r.reported.id) ??
      ({ ...r.reported, reports: [], reporters: 0, lastContacted: null } satisfies ReportedPerson);
    p.reports.push({ id: r.id, reason: r.reason, note: r.note, reporterId: r.reporterId, reporter: r.reporter.name ?? r.reporter.email, at: r.createdAt });
    byPerson.set(r.reported.id, p);
  }
  const people = [...byPerson.values()];
  for (const p of people) p.reporters = new Set(p.reports.map((r) => r.reporterId)).size;

  const contacts = await prisma.outreach.findMany({
    where: { userId: { in: people.map((p) => p.id) } },
    orderBy: { createdAt: "desc" },
    select: { userId: true, createdAt: true, template: true, adminEmail: true },
  });
  for (const c of contacts) {
    const p = byPerson.get(c.userId);
    if (p && !p.lastContacted) p.lastContacted = { at: c.createdAt, template: c.template, by: c.adminEmail };
  }
  return people.sort((a, b) => b.reporters - a.reporters || b.reports.length - a.reports.length);
}

/** What an admin should see on one person's page: whether they are held, reports on file, and past outreach. */
export async function getTrust(userId: string) {
  const [u, reports, outreach] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { heldAt: true, heldReason: true } }),
    prisma.userReport.count({ where: { reportedId: userId } }),
    prisma.outreach.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, template: true, adminEmail: true, createdAt: true } }),
  ]);
  return { heldAt: u?.heldAt ?? null, heldReason: u?.heldReason ?? null, reports, outreach };
}
