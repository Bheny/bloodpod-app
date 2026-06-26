import { NextResponse } from "next/server";
import { getInvitePreview } from "@/lib/invite";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const preview = await getInvitePreview(token);

  if (!preview) {
    return NextResponse.json(
      { error: "This invite has expired or is no longer valid." },
      { status: 404 },
    );
  }

  return NextResponse.json(preview);
}
