import { getGardenSummary } from "@/lib/garden-data";
import { GardenStrip } from "@/components/garden/GardenStrip";

/**
 * The Garden strip that loads its own data, for screens that should only show it and know nothing about it
 * (the Pod list). Reading only: it changes nothing about who is alerted, listed or able to join.
 */
export async function GardenStripLoader({ userId }: { userId: string }) {
  return <GardenStrip garden={await getGardenSummary(userId)} />;
}
