import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createCareProfile } from "@/lib/care";
import { createCareSchema } from "@/lib/validations/care";

/** Creates a Care Pod for a patient. Needs a Care Pod subscription, read from the database. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.hospitalId || user.labId) return NextResponse.json({ error: "Not available for this account" }, { status: 403 });

  const parsed = createCareSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the details and try again" }, { status: 400 });
  }
  const d = parsed.data;

  const result = await createCareProfile(user.id, {
    displayName: d.displayName,
    conditionType: d.conditionType,
    conditionVisibility: d.conditionVisibility,
    bloodType: d.bloodType,
    hospitalName: d.hospitalName?.trim() || null,
    transfusionIntervalDays: d.transfusionIntervalDays ?? null,
    nextTransfusionAt: new Date(d.nextTransfusionAt),
    donorsNeeded: d.donorsNeeded,
    podId: d.podId ?? null,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ id: result.id }, { status: 201 });
}
