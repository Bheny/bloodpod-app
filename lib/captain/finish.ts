import { closeDrillIfOver } from "@/lib/captain/drill";
import { recomputeForPodChain } from "@/lib/captain/status";

/** Closes a drill whose window is over and, the first time, brings the Pod's level (and its parents') up to date. */
export async function finishDrill(drillId: string) {
  const closed = await closeDrillIfOver(drillId);
  if (closed?.closedNow) await recomputeForPodChain(closed.podId);
  return closed;
}
