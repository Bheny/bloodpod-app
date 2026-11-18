import { notFound } from "next/navigation";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";

/** Admins are listed in ADMIN_EMAILS (comma separated). Empty or unset means nobody. */
function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && adminEmails().includes(email.trim().toLowerCase());
}

/**
 * For admin pages. Call it at the top of EVERY admin page, not only the layout:
 * layouts are not re-run on client navigation, so a layout check alone is not enough.
 * Anyone who is not an admin gets a plain 404, so the area is not discoverable.
 */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !isAdminEmail(user.email)) notFound();
  return user;
}

/** For admin API routes. Returns the admin user, or a 404 response to send back. */
export async function requireAdminApi() {
  const user = await getCurrentUser();
  if (!user || !isAdminEmail(user.email)) {
    return { user: null, denied: NextResponse.json({ error: "Not found" }, { status: 404 }) } as const;
  }
  return { user, denied: null } as const;
}
