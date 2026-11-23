import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getRequesterView } from "@/lib/alerts";

export const dynamic = "force-dynamic";

/** The person who asked follows their request here. Anyone else gets the same answer as a request that is not there. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const view = await getRequesterView(user.id, id);
  if (!view) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  return NextResponse.json({ request: view }, { headers: { "Cache-Control": "no-store" } });
}
