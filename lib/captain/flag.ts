import { prisma } from "@/lib/prisma";
import { CAPTAIN } from "@/lib/captain-config";

/**
 * The whole Captain programme sits behind this one switch (AppSetting "captain_programme" = "true").
 * Off, or unreadable, means off: no Captain screen, badge, job or notification runs.
 */
export async function isCaptainEnabled(): Promise<boolean> {
  try {
    const row = await prisma.appSetting.findUnique({ where: { key: CAPTAIN.flagKey } });
    return row?.value === "true";
  } catch {
    return false;
  }
}
