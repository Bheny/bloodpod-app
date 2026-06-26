import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getFeedPage } from "@/lib/feed-data";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor") ?? undefined;

  const page = await getFeedPage(cursor);
  return NextResponse.json(page);
}
