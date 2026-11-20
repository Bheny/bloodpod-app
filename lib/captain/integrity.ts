import { CAPTAIN } from "@/lib/captain-config";
import { phoneKey } from "@/lib/captain/compute";
import type { IntegrityFlag, TreePod } from "@/lib/captain/types";

/**
 * Patterns worth a human look. These only ever raise a flag for the admin review queue: they never
 * block a Pod, remove a member or stop a promotion by themselves.
 *
 * "Same device" is not here because the app does not record devices yet. Add it when it does.
 */
export function findIntegrityFlags(parent: TreePod): IntegrityFlag[] {
  const flags: IntegrityFlag[] = [];
  const minute = 60_000;

  for (const child of parent.children) {
    const a = phoneKey(parent.leaderPhone);
    const b = phoneKey(child.leaderPhone);

    if (a && b && a === b) {
      flags.push({ code: "same_phone", podId: child.id, detail: "The two leaders share a phone number." });
    } else if (a && b && Math.abs(Number(a) - Number(b)) <= 3) {
      // 0244123456 and 0244123457: numbers bought together are often one person.
      flags.push({ code: "phone_pattern", podId: child.id, detail: "The two leaders' numbers are next to each other." });
    }

    const gap = child.createdAt.getTime() - parent.createdAt.getTime();
    if (gap >= 0 && gap <= CAPTAIN.integrity.childCreatedWithinMinutes * minute) {
      flags.push({
        code: "created_fast",
        podId: child.id,
        detail: `Started ${Math.round(gap / minute)} minutes after the Pod it grew from.`,
      });
    }
  }

  // Many people joining one Pod within a couple of minutes.
  for (const pod of [parent, ...parent.children]) {
    const times = pod.members.map((m) => m.joinedAt.getTime()).sort((x, y) => x - y);
    const n = CAPTAIN.integrity.burstJoinCount;
    for (let i = 0; i + n - 1 < times.length; i++) {
      if (times[i + n - 1] - times[i] <= CAPTAIN.integrity.burstWithinMinutes * minute) {
        flags.push({ code: "burst_joins", podId: pod.id, detail: `${n} people joined within ${CAPTAIN.integrity.burstWithinMinutes} minutes.` });
        break;
      }
    }
  }

  return flags;
}
