import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/admin/auth";
import { REPORT, cleanReport, shouldHold } from "@/lib/report-rules";

const DAY = 86_400_000;

type Result = { ok: true; already?: boolean } | { ok: false; error: string; status: number };
const fail = (error: string, status = 400): Result => ({ ok: false, error, status });

/**
 * You can only report someone you have actually met through BloodPod: you share a Pod, or one of you
 * asked the other for blood. That keeps a report from being a way to target a stranger.
 */
async function metThroughBloodPod(a: string, b: string): Promise<boolean> {
  const [pod, alert] = await Promise.all([
    prisma.pod.findFirst({
      where: {
        OR: [
          { ownerId: a, members: { some: { userId: b } } },
          { ownerId: b, members: { some: { userId: a } } },
          { members: { some: { userId: a } }, AND: [{ members: { some: { userId: b } } }] },
        ],
      },
      select: { id: true },
    }),
    prisma.bloodRequest.findFirst({
      where: {
        OR: [
          { requesterId: a, recipients: { some: { userId: b } } },
          { requesterId: b, recipients: { some: { userId: a } } },
        ],
      },
      select: { id: true },
    }),
  ]);
  return Boolean(pod || alert);
}

export async function createReport(reporterId: string, raw: Record<string, unknown>): Promise<Result> {
  const clean = cleanReport(raw);
  if (!clean.ok) return fail(clean.error);
  const { userId: reportedId, reason, note } = clean.value;
  if (reportedId === reporterId) return fail("You cannot report yourself.");

  const [reported, today, open] = await Promise.all([
    prisma.user.findUnique({ where: { id: reportedId }, select: { id: true, email: true } }),
    prisma.userReport.count({ where: { reporterId, createdAt: { gt: new Date(Date.now() - DAY) } } }),
    prisma.userReport.findFirst({ where: { reporterId, reportedId, status: "OPEN" }, select: { id: true } }),
  ]);
  // The same answer whether or not the person exists or is staff, so this cannot be used to look people up.
  if (!reported || isAdminEmail(reported.email)) return fail("We could not find that person.", 404);
  if (open) return { ok: true, already: true };
  if (today >= REPORT.perDay) return fail("You have sent several reports today. We will look at them, please try again tomorrow.", 429);
  if (!(await metThroughBloodPod(reporterId, reportedId))) return fail("We could not find that person.", 404);

  await prisma.userReport.create({ data: { reporterId, reportedId, reason, note } });

  const reporters = await prisma.userReport.findMany({ where: { reportedId, status: "OPEN" }, select: { reporterId: true }, distinct: ["reporterId"] });
  if (shouldHold(reporters.length)) {
    await prisma.user.updateMany({
      where: { id: reportedId, heldAt: null },
      data: { heldAt: new Date(), heldReason: `Reported by ${reporters.length} different people` },
    });
  }
  return { ok: true };
}

export type ReviewAction = "dismiss" | "action" | "hold" | "release";

/** An admin's decision about one reported person. Closes their open reports and records who decided. */
export async function reviewReports(adminEmail: string, reportedId: string, action: ReviewAction, adminNote: string | null) {
  const now = new Date();
  const note = adminNote?.trim().slice(0, 500) || null;

  if (action === "hold") {
    await prisma.user.update({ where: { id: reportedId }, data: { heldAt: now, heldReason: note ?? "Paused by an admin" } });
    return;
  }
  if (action === "release") {
    await prisma.user.update({ where: { id: reportedId }, data: { heldAt: null, heldReason: null } });
  }
  // Releasing and dismissing both clear the account and close its reports; "action" closes them and keeps the hold.
  await prisma.userReport.updateMany({
    where: { reportedId, status: "OPEN" },
    data: { status: action === "action" ? "ACTIONED" : "DISMISSED", handledAt: now, handledBy: adminEmail, adminNote: note },
  });
  if (action === "action") {
    await prisma.user.updateMany({ where: { id: reportedId, heldAt: null }, data: { heldAt: now, heldReason: note ?? "Reports confirmed by an admin" } });
  }
  if (action === "dismiss") {
    await prisma.user.updateMany({ where: { id: reportedId, heldAt: { not: null } }, data: { heldAt: null, heldReason: null } });
  }
}

export async function logOutreach(adminEmail: string, userId: string, template: string) {
  await prisma.outreach.create({ data: { userId, adminEmail, template } });
}
