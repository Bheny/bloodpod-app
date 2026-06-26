import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPassportData } from "@/lib/passport-data";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await getPassportData(user.id);
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(data);
}
