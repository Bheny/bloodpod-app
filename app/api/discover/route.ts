import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getDiscoverDonors } from "@/lib/discover-data";
import { isBloodType } from "@/lib/blood-type";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const bloodTypeParam = searchParams.get("bloodType");
  const city = searchParams.get("city") ?? undefined;
  const eligibleOnly = searchParams.get("eligibleOnly") === "true";

  const result = await getDiscoverDonors(user.id, {
    bloodType: bloodTypeParam && isBloodType(bloodTypeParam) ? bloodTypeParam : undefined,
    city,
    eligibleOnly,
  });

  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(result);
}
