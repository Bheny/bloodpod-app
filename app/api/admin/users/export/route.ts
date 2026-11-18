import { requireAdminApi } from "@/lib/admin/auth";
import { getUsersForExport } from "@/lib/admin/metrics";
import { BLOOD_TYPE_LABELS } from "@/lib/blood-type";

// Spreadsheet apps run text that starts with = + - or @ as a formula, so prefix those.
function cell(value: string | number | boolean | null | undefined): string {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}

export async function GET(request: Request) {
  const { denied } = await requireAdminApi();
  if (denied) return denied;

  const params = new URL(request.url).searchParams;
  const users = await getUsersForExport({
    q: params.get("q") ?? undefined,
    blood: params.get("blood") ?? undefined,
    status: params.get("status") ?? undefined,
  });

  const header = [
    "Name",
    "Email",
    "Phone",
    "City",
    "Blood type",
    "Eligible",
    "Alerts on",
    "Onboarded",
    "Pods owned",
    "Pods joined",
    "Donations",
    "Joined",
  ];

  const lines = users.map((u) =>
    [
      u.name,
      u.email,
      u.phone,
      u.city,
      u.bloodType ? BLOOD_TYPE_LABELS[u.bloodType] : "",
      u.isEligible ? "Yes" : "No",
      u._count.pushSubscriptions > 0 ? "Yes" : "No",
      u.onboardingComplete ? "Yes" : "No",
      u._count.ownedPods,
      u._count.podMemberships,
      u._count.donations,
      u.createdAt.toISOString().slice(0, 10),
    ]
      .map(cell)
      .join(","),
  );

  const csv = [header.map(cell).join(","), ...lines].join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bloodpod-users-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
