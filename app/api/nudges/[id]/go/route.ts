import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { answerNudge, safePath } from "@/lib/nudges";

export const dynamic = "force-dynamic";

/** Where a nudge button or a phone notification lands: note that it worked, then go on to the real page. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const url = new URL(request.url);
  const to = safePath(url.searchParams.get("to"));
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL(`/sign-in?next=${encodeURIComponent(to)}`, url));
  const { id } = await params;
  await answerNudge(user.id, id, "acted");
  return NextResponse.redirect(new URL(to, url));
}
