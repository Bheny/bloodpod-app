import type { BloodType, RequestUrgency } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BLOOD_TYPE_LABELS } from "@/lib/blood-type";

/** What a donor may see about an open request. Never the requester's contact details. */
export interface EmergencyView {
  id: string;
  bloodType: string;
  urgency: RequestUrgency;
  facility: string;
  location: string | null;
  requesterName: string | null;
  createdAt: string;
}

const URGENCY_RANK: Record<RequestUrgency, number> = { CRITICAL: 3, URGENT: 2, STANDARD: 1 };

export async function getOpenEmergencies(
  userId: string,
  bloodType: BloodType | null,
): Promise<EmergencyView[]> {
  if (!bloodType) return [];

  const rows = await prisma.bloodRequest.findMany({
    where: { bloodType, status: "OPEN", requesterId: { not: userId } },
    select: {
      id: true,
      bloodType: true,
      urgency: true,
      facility: true,
      location: true,
      createdAt: true,
      requester: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return rows
    .map((r) => ({
      id: r.id,
      bloodType: BLOOD_TYPE_LABELS[r.bloodType],
      urgency: r.urgency,
      facility: r.facility,
      location: r.location,
      requesterName: r.requester.name,
      createdAt: r.createdAt.toISOString(),
    }))
    .sort((a, b) => URGENCY_RANK[b.urgency] - URGENCY_RANK[a.urgency]);
}
