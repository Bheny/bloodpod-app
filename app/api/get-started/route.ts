import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isStepId } from "@/lib/get-started";

const schema = z.discriminatedUnion("action", [
  // They opened a step, or chose to skip it.
  z.object({ action: z.literal("seen"), step: z.string().refine(isStepId, "Unknown step") }),
  z.object({ action: z.literal("dismiss") }),
  z.object({ action: z.literal("restore") }),
  z.object({ action: z.literal("tour-done") }),
]);

/**
 * Records the few things about the checklist and tour that cannot be read from what the person has done.
 * Whether a step is finished is never sent from the browser: the server works that out itself.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const body = parsed.data;

  if (body.action === "seen") {
    const next = [...new Set([...user.getStartedSeen, body.step])];
    await prisma.user.update({ where: { id: user.id }, data: { getStartedSeen: next } });
  } else if (body.action === "dismiss") {
    await prisma.user.update({ where: { id: user.id }, data: { getStartedDismissedAt: new Date() } });
  } else if (body.action === "restore") {
    await prisma.user.update({ where: { id: user.id }, data: { getStartedDismissedAt: null } });
  } else {
    await prisma.user.update({ where: { id: user.id }, data: { tourSeenAt: new Date() } });
  }

  return NextResponse.json({ success: true });
}
