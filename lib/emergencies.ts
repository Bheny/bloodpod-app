import type { RequestUrgency } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BLOOD_TYPE_LABELS } from "@/lib/blood-type";
import { firstName } from "@/lib/alert-rules";

/** What a donor may see about an open request they were asked about. Never the requester's contact details. */
export interface EmergencyView {
  id: string;
  bloodType: string;
  urgency: RequestUrgency;
  facility: string;
  location: string | null;
  requesterName: string | null;
  createdAt: string;
  /** "COMING", "CANT", or null when they have not answered yet. */
  myAnswer: "COMING" | "CANT" | null;
  isTest: boolean;
}

const URGENCY_RANK: Record<RequestUrgency, number> = { CRITICAL: 3, URGENT: 2, STANDARD: 1 };

/**
 * The open requests this person was asked about, most urgent first. Being the same blood type is not
 * enough to see a request: only people the alert actually went to (their Pod, then donors nearby) do.
 * Someone who said they cannot come no longer sees it.
 */
export async function getOpenEmergencies(userId: string): Promise<EmergencyView[]> {
  const now = new Date();
  const rows = await prisma.bloodRequestRecipient.findMany({
    where: {
      userId,
      OR: [{ answer: null }, { answer: "COMING" }],
      request: { status: "OPEN", requesterId: { not: userId }, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
    },
    select: {
      answer: true,
      request: {
        select: {
          id: true,
          bloodType: true,
          urgency: true,
          facility: true,
          location: true,
          isTest: true,
          createdAt: true,
          requester: { select: { name: true } },
        },
      },
    },
    orderBy: { notifiedAt: "desc" },
    take: 5,
  });

  return rows
    .map(({ answer, request: r }) => ({
      id: r.id,
      bloodType: BLOOD_TYPE_LABELS[r.bloodType],
      urgency: r.urgency,
      facility: r.facility,
      location: r.location,
      requesterName: firstName(r.requester.name),
      createdAt: r.createdAt.toISOString(),
      myAnswer: answer,
      isTest: r.isTest,
    }))
    .sort((a, b) => URGENCY_RANK[b.urgency] - URGENCY_RANK[a.urgency]);
}
