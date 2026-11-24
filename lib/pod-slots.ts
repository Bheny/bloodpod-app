import { prisma } from "@/lib/prisma";
import { READINESS } from "@/lib/readiness-config";
import { nextSlotLimit, SLOT_PASS_FRESH_DAYS } from "@/lib/pod-slot-rules";
import { countedMembers } from "@/lib/readiness/members";
import { podPeople } from "@/lib/readiness/people";

const DAY = 86_400_000;

/**
 * Gives a Pod more slots when it qualifies: every slot used, enough ready people, and a practice alert
 * passed in the last 90 days. Safe to call any number of times; it only ever raises the limit, one step at a
 * time. Returns the limit the Pod has afterwards. It never throws, so it cannot break a join or an invite.
 */
export async function growSlotsIfEarned(podId: string): Promise<number | null> {
  try {
    const pod = await prisma.pod.findUnique({ where: { id: podId }, select: { slotLimit: true } });
    if (!pod) return null;
    const found = await podPeople(podId);
    if (!found) return pod.slotLimit;

    // Cheap exit: a Pod with free slots needs no growth, so skip the lookup of past drills.
    if (found.people.length < pod.slotLimit) return pod.slotLimit;

    const passed = await prisma.drill.findFirst({
      where: { podId, passed: true, closedAt: { gte: new Date(Date.now() - SLOT_PASS_FRESH_DAYS * DAY) } },
      select: { id: true },
    });
    const next = nextSlotLimit({
      slotLimit: pod.slotLimit,
      people: found.people.length,
      ready: countedMembers(found.people).length,
      complete: READINESS.podComplete,
      passedRecently: !!passed,
    });
    if (next === pod.slotLimit) return pod.slotLimit;

    // updateMany with the old limit means two callers raise it once, not twice.
    const done = await prisma.pod.updateMany({ where: { id: podId, slotLimit: pod.slotLimit }, data: { slotLimit: next } });
    return done.count === 1 ? next : pod.slotLimit;
  } catch {
    return null;
  }
}
