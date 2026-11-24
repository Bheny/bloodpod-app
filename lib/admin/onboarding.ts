import { adb as prisma } from "@/lib/admin/db";

const DAY = 86_400_000;

/** In the order the sign-up asks for them, so the first thing missing is where the person stopped. */
export const SETUP_STAGES = [
  { id: "blood", label: "Blood type", hint: "Never answered the first questions" },
  { id: "donation", label: "Last donation", hint: "Has not said when they last gave" },
  { id: "city", label: "Where they are", hint: "Has not shared a city or location" },
  { id: "phone", label: "Phone number", hint: "Has no number yet" },
  { id: "consent", label: "Agreeing to alerts", hint: "Has not agreed to emergency alerts" },
  { id: "last", label: "Last steps", hint: "Everything answered, but did not tap finish" },
] as const;

export interface SetupStageRow {
  id: string;
  label: string;
  hint: string;
  /** Signed up in the last 7 days, so still worth a message. */
  recent: number;
  older: number;
}

/** Where people who signed up and never finished are sitting. Worked out from what they have actually given us. */
export async function getSetupDropOff(days: number) {
  const since = new Date(Date.now() - days * DAY);
  const week = new Date(Date.now() - 7 * DAY);

  const [rows, totals] = await Promise.all([
    prisma.$queryRaw<{ stage: string; recent: number; older: number }[]>`
      SELECT CASE
               WHEN "bloodType" IS NULL THEN 'blood'
               WHEN "donationInfoAt" IS NULL AND "lastDonated" IS NULL THEN 'donation'
               WHEN "city" IS NULL THEN 'city'
               WHEN "phone" IS NULL THEN 'phone'
               WHEN "emergencyConsentAt" IS NULL THEN 'consent'
               ELSE 'last'
             END AS stage,
             COUNT(*) FILTER (WHERE "createdAt" >= ${week})::int AS recent,
             COUNT(*) FILTER (WHERE "createdAt" < ${week})::int AS older
      FROM "User"
      WHERE "onboardingComplete" = false AND "hospitalId" IS NULL AND "labId" IS NULL AND "createdAt" >= ${since}
      GROUP BY 1`,
    prisma.$queryRaw<{ signedUp: number; finished: number }[]>`
      SELECT COUNT(*)::int AS "signedUp", COUNT(*) FILTER (WHERE "onboardingComplete")::int AS finished
      FROM "User" WHERE "hospitalId" IS NULL AND "labId" IS NULL AND "createdAt" >= ${since}`,
  ]);

  const byStage = new Map(rows.map((r) => [r.stage, r]));
  const stages: SetupStageRow[] = SETUP_STAGES.map((s) => ({
    id: s.id,
    label: s.label,
    hint: s.hint,
    recent: byStage.get(s.id)?.recent ?? 0,
    older: byStage.get(s.id)?.older ?? 0,
  }));
  const stuck = stages.reduce((n, s) => n + s.recent + s.older, 0);
  const t = totals[0] ?? { signedUp: 0, finished: 0 };
  const worst = [...stages].sort((a, b) => b.recent + b.older - (a.recent + a.older))[0];

  return {
    stages,
    stuck,
    signedUp: t.signedUp,
    finished: t.finished,
    finishedShare: t.signedUp > 0 ? Math.round((t.finished / t.signedUp) * 100) : 0,
    biggest: stuck > 0 ? worst : null,
  };
}
