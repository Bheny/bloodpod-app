import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getOpenEmergencies } from "@/lib/emergencies";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const emergencies = await getOpenEmergencies(user.id, user.bloodType);
  return NextResponse.json({ emergencies }, { headers: { "Cache-Control": "no-store" } });
}
