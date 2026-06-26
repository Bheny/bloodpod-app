import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getActivityFeed } from "@/lib/activity";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(Number(searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 20, 1), 50);

  const feed = await getActivityFeed(user.id, page, limit);
  return NextResponse.json(feed);
}
