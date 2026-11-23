import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getOpenEmergencies } from "@/lib/emergencies";
import { widenDueAlerts } from "@/lib/alerts";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Whoever is looking is a good moment to widen any request that has waited long enough.
  await widenDueAlerts(3).catch(() => 0);
  const emergencies = await getOpenEmergencies(user.id);
  return NextResponse.json({ emergencies }, { headers: { "Cache-Control": "no-store" } });
}
