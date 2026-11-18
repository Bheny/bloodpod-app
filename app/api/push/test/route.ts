import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { sendPushToUser } from "@/lib/push";

// Sends a test notification to the signed-in user's own devices only.
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const result = await sendPushToUser(user.id, {
      title: "BloodPod test alert",
      body: "Push notifications are working on this device.",
      url: "/dashboard",
      tag: "test",
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Push is not configured" }, { status: 500 });
  }
}
