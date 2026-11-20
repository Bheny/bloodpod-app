import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isCaptainEnabled } from "@/lib/captain/flag";

/** Every Captain API starts here: switched off or signed out looks the same as "no such route". */
export async function captainApi() {
  if (!(await isCaptainEnabled())) return { user: null, denied: NextResponse.json({ error: "Not found" }, { status: 404 }) } as const;
  const user = await getCurrentUser();
  if (!user) return { user: null, denied: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;
  return { user, denied: null } as const;
}
