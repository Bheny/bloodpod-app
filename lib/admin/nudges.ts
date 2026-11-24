import { adb as prisma } from "@/lib/admin/db";
import { KIND_LABEL, NUDGE_KINDS, type NudgeKind } from "@/lib/nudge-rules";

const DAY = 86_400_000;

export interface NudgeKindStats {
  kind: NudgeKind;
  label: string;
  /** Times it was put in front of someone. */
  shown: number;
  pushed: number;
  emailed: number;
  dismissed: number;
  acted: number;
  /** Share of those shown who did the thing. */
  actRate: number;
}

/** How each kind of nudge is doing: shown, sent, and acted on. A nudge nobody acts on gets reworded or removed. */
export async function getNudgeStats(days: number) {
  const since = new Date(Date.now() - days * DAY);
  const [rows, off, total] = await Promise.all([
    prisma.$queryRaw<{ kind: string; shown: number; pushed: number; emailed: number; dismissed: number; acted: number }[]>`
      SELECT kind,
             COUNT(*)::int AS shown,
             COUNT("pushedAt")::int AS pushed,
             COUNT("emailedAt")::int AS emailed,
             COUNT("dismissedAt")::int AS dismissed,
             COUNT("actedAt")::int AS acted
      FROM "Nudge" WHERE "createdAt" >= ${since} GROUP BY kind`,
    prisma.user.count({ where: { nudgesOff: true } }),
    prisma.user.count({ where: { onboardingComplete: true } }),
  ]);

  const byKind = new Map(rows.map((r) => [r.kind, r]));
  const kinds: NudgeKindStats[] = NUDGE_KINDS.map((kind) => {
    const r = byKind.get(kind);
    const shown = r?.shown ?? 0;
    const acted = r?.acted ?? 0;
    return {
      kind,
      label: KIND_LABEL[kind],
      shown,
      pushed: r?.pushed ?? 0,
      emailed: r?.emailed ?? 0,
      dismissed: r?.dismissed ?? 0,
      acted,
      actRate: shown > 0 ? Math.round((acted / shown) * 100) : 0,
    };
  });

  const shown = kinds.reduce((n, k) => n + k.shown, 0);
  const acted = kinds.reduce((n, k) => n + k.acted, 0);
  return {
    kinds,
    shown,
    acted,
    actRate: shown > 0 ? Math.round((acted / shown) * 100) : 0,
    switchedOff: off,
    switchedOffShare: total > 0 ? Math.round((off / total) * 100) : 0,
  };
}
