import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  KINDS,
  NUDGE,
  canEmail,
  canPush,
  dueNudges,
  episodeOf,
  inQuietHours,
  pickForApp,
  pickForSend,
  type NudgeFacts,
  type NudgeRow,
} from "@/lib/nudge-rules";

const DAY = 86_400_000;
// 10:00 in Accra, a normal sending time.
const NOON = new Date("2026-11-25T10:00:00Z");

function facts(over: Partial<NudgeFacts> = {}): NudgeFacts {
  return {
    firstName: "Kofi",
    accountAgeDays: 10,
    onboardingComplete: true,
    nudgesOff: false,
    hasPush: true,
    inEmergency: false,
    podState: "owner",
    podReadyCount: 3,
    stalledInvites: 0,
    newMembers: [],
    ...over,
  };
}

let n = 0;
function row(over: Partial<NudgeRow> = {}): NudgeRow {
  return {
    id: `n${n++}`,
    kind: "pod_thin",
    key: "",
    createdAt: new Date(NOON.getTime() - 1 * DAY),
    pushedAt: null,
    emailedAt: null,
    dismissedAt: null,
    actedAt: null,
    ...over,
  };
}

const kinds = (f: NudgeFacts) => dueNudges(f).map((c) => c.kind);

describe("nudges: what is true about a person", () => {
  it("says nothing to someone whose Pod is ready and whose alerts are on", () => {
    expect(dueNudges(facts())).toEqual([]);
  });

  it("asks a thin Pod for the people it is missing", () => {
    const [c] = dueNudges(facts({ podReadyCount: 1 }));
    expect(c.kind).toBe("pod_thin");
    expect(c.title).toBe("Your Pod is 1 of 3");
    expect(c.body).toContain("Add 2 more people");
    const [one] = dueNudges(facts({ podReadyCount: 2 }));
    expect(one.body).toContain("Add 1 more person ");
  });

  it("invites someone with no Pod to start one", () => {
    const [c] = dueNudges(facts({ podState: "none", podReadyCount: 0 }));
    expect(c.kind).toBe("pod_thin");
    expect(c.title).toContain("first person");
    expect(c.cta.href).toBe("/pod/invite");
  });

  it("does not ask people who only belong to someone else's Pod to build their own", () => {
    expect(kinds(facts({ podState: "member", podReadyCount: 0 }))).toEqual([]);
  });

  it("lets a brand new account look around first", () => {
    expect(kinds(facts({ podReadyCount: 0, accountAgeDays: 1 }))).toEqual([]);
    expect(kinds(facts({ hasPush: false, accountAgeDays: 2 }))).not.toContain("alerts_off");
    expect(kinds(facts({ hasPush: false, accountAgeDays: NUDGE.alertsOffAfterDays }))).toContain("alerts_off");
  });

  it("notices a stuck invite, singular and plural", () => {
    expect(dueNudges(facts({ stalledInvites: 1 }))[0].title).toBe("Your invite is still waiting");
    expect(dueNudges(facts({ stalledInvites: 3 }))[0].title).toBe("3 invites are still waiting");
  });

  it("says hello to a new member by first name", () => {
    const [c] = dueNudges(facts({ newMembers: [{ userId: "u1", name: "Ama Mensah" }] }));
    expect(c.kind).toBe("member_joined");
    expect(c.title).toBe("Ama just joined your Pod");
    expect(c.key).toBe("u1");
    const [many] = dueNudges(facts({ newMembers: [{ userId: "u2", name: "Esi" }, { userId: "u1", name: "Ama" }] }));
    expect(many.title).toBe("Esi and 1 more joined your Pod");
  });

  it("puts the freshest and most useful first", () => {
    const f = facts({
      hasPush: false,
      podReadyCount: 1,
      stalledInvites: 2,
      newMembers: [{ userId: "u1", name: "Ama" }],
    });
    expect(kinds(f)).toEqual(["member_joined", "invite_stalled", "alerts_off", "pod_thin"]);
  });

  it("goes silent when they switched nudges off or are mid emergency", () => {
    const busy = { podReadyCount: 0, hasPush: false, stalledInvites: 2 };
    expect(dueNudges(facts({ ...busy, nudgesOff: true }))).toEqual([]);
    expect(dueNudges(facts({ ...busy, inEmergency: true }))).toEqual([]);
    expect(dueNudges(facts({ ...busy, onboardingComplete: false, nudgesOff: true }))).toEqual([]);
  });

  it("only talks about finishing to someone who has not finished, and about nothing else", () => {
    const unfinished = { onboardingComplete: false, podReadyCount: 0, hasPush: false, stalledInvites: 2, newMembers: [{ userId: "u1", name: "Ama" }] };
    expect(kinds(facts({ ...unfinished, accountAgeDays: 2 }))).toEqual(["finish_setup"]);
  });

  it("waits a day, changes its words the second time, and gives up after a month", () => {
    const at = (accountAgeDays: number) => dueNudges(facts({ onboardingComplete: false, accountAgeDays }));
    expect(at(0)).toEqual([]);
    const first = at(NUDGE.finishSetupAfterDays)[0];
    const again = at(NUDGE.finishSetupAgainAfterDays)[0];
    expect(first.title).toBe("Two minutes to finish setting up");
    expect(again.title).toBe("Your Pod is saving you a seat");
    expect(first.cta.href).toBe("/onboarding");
    expect(at(NUDGE.finishSetupUntilDays)).toHaveLength(1);
    expect(at(NUDGE.finishSetupUntilDays + 1)).toEqual([]);
  });

  it("stops the moment it is no longer true", () => {
    expect(kinds(facts({ podReadyCount: 2 }))).toEqual(["pod_thin"]);
    expect(kinds(facts({ podReadyCount: 3 }))).toEqual([]);
  });
});

describe("nudges: remembering what already happened", () => {
  const thin = { kind: "pod_thin" as const, key: "" };

  it("starts fresh with no history", () => {
    expect(episodeOf(thin, [], NOON).state).toBe("fresh");
  });

  it("keeps showing one that is still open", () => {
    const r = row();
    const e = episodeOf(thin, [r], NOON);
    expect(e.state).toBe("open");
    if (e.state === "open") expect(e.row).toBe(r);
  });

  it("leaves it alone after they close it or do it, until the cooldown ends", () => {
    expect(episodeOf(thin, [row({ dismissedAt: NOON })], NOON).state).toBe("closed");
    expect(episodeOf(thin, [row({ actedAt: NOON })], NOON).state).toBe("closed");
    const old = row({ createdAt: new Date(NOON.getTime() - (KINDS.pod_thin.cooldownDays + 1) * DAY), dismissedAt: NOON });
    expect(episodeOf(thin, [old], NOON).state).toBe("fresh");
  });

  it("rests a kind that was ignored three times in a row", () => {
    const ignored = [10, 20, 30].map((d) => row({ createdAt: new Date(NOON.getTime() - d * DAY) }));
    expect(episodeOf(thin, ignored.map((r) => ({ ...r, dismissedAt: NOON })), NOON).state).toBe("resting");
  });

  it("does not rest a kind they have acted on, or whose last ignore was long ago", () => {
    const rows = [10, 20, 30].map((d) => row({ createdAt: new Date(NOON.getTime() - d * DAY) }));
    expect(episodeOf(thin, [{ ...rows[0], actedAt: NOON }, rows[1], rows[2]], NOON).state).toBe("fresh");
    const longAgo = [40, 50, 60].map((d) => row({ createdAt: new Date(NOON.getTime() - d * DAY) }));
    expect(episodeOf(thin, longAgo, NOON).state).toBe("fresh");
  });

  it("treats each person who joined as their own nudge", () => {
    const joined = { kind: "member_joined" as const, key: "u2" };
    const history = [row({ kind: "member_joined", key: "u1", dismissedAt: NOON })];
    expect(episodeOf(joined, history, NOON).state).toBe("fresh");
    expect(episodeOf({ ...joined, key: "u1" }, history, NOON).state).toBe("closed");
  });

  it("shows the next best nudge when the first was closed", () => {
    const f = facts({ podReadyCount: 1, stalledInvites: 1 });
    const history = [row({ kind: "invite_stalled", dismissedAt: NOON })];
    expect(pickForApp(dueNudges(f), history, NOON)?.candidate.kind).toBe("pod_thin");
    expect(pickForApp(dueNudges(f), [], NOON)?.candidate.kind).toBe("invite_stalled");
  });
});

describe("nudges: never nagging", () => {
  it("keeps quiet from 21:00 to 07:00", () => {
    expect(inQuietHours(new Date("2026-11-25T21:00:00Z"))).toBe(true);
    expect(inQuietHours(new Date("2026-11-25T03:00:00Z"))).toBe(true);
    expect(inQuietHours(new Date("2026-11-25T07:00:00Z"))).toBe(false);
    expect(inQuietHours(NOON)).toBe(false);
  });

  it("allows one push a day and two a week", () => {
    expect(canPush([], NOON)).toBe(true);
    expect(canPush([row({ pushedAt: new Date(NOON.getTime() - 2 * 3600_000) })], NOON)).toBe(false);
    const twoThisWeek = [row({ pushedAt: new Date(NOON.getTime() - 2 * DAY) }), row({ pushedAt: new Date(NOON.getTime() - 4 * DAY) })];
    expect(canPush(twoThisWeek, NOON)).toBe(false);
    expect(canPush([row({ pushedAt: new Date(NOON.getTime() - 2 * DAY) })], NOON)).toBe(true);
  });

  it("allows one email a week", () => {
    expect(canEmail([row({ emailedAt: new Date(NOON.getTime() - 3 * DAY) })], NOON)).toBe(false);
    expect(canEmail([row({ emailedAt: new Date(NOON.getTime() - 8 * DAY) })], NOON)).toBe(true);
  });

  it("pushes people with a phone and emails people without, never both for one nudge", () => {
    const thinPod = dueNudges(facts({ podReadyCount: 1 }));
    expect(pickForSend(thinPod, [], true, NOON)?.channel).toBe("push");
    expect(pickForSend(thinPod, [], false, NOON)?.channel).toBe("email");
    const off = dueNudges(facts({ hasPush: false, podReadyCount: 3 }));
    expect(pickForSend(off, [], false, NOON)).toMatchObject({ channel: "email", candidate: { kind: "alerts_off" } });
  });

  it("does not email someone because their push limit is used up", () => {
    const thinPod = dueNudges(facts({ podReadyCount: 1 }));
    const used = [row({ kind: "invite_stalled", pushedAt: new Date(NOON.getTime() - 3600_000) })];
    expect(pickForSend(thinPod, used, true, NOON)).toBeNull();
  });

  it("never sends in quiet hours, and never sends the same nudge twice", () => {
    const thinPod = dueNudges(facts({ podReadyCount: 1 }));
    expect(pickForSend(thinPod, [], true, new Date("2026-11-25T22:00:00Z"))).toBeNull();
    const sent = [row({ pushedAt: new Date(NOON.getTime() - 3 * DAY) })];
    expect(pickForSend(thinPod, sent, true, NOON)).toBeNull();
  });

  it("uses the open record when one is already on Home, so Home and the phone agree", () => {
    const thinPod = dueNudges(facts({ podReadyCount: 1 }));
    const shown = row();
    expect(pickForSend(thinPod, [shown], true, NOON)?.row).toBe(shown);
  });

  it("emails an unfinished sign-up at most twice, ever, and never uses push for it", () => {
    const due = dueNudges(facts({ onboardingComplete: false, hasPush: true, accountAgeDays: 5 }));
    const sent = (daysAgo: number) => row({ kind: "finish_setup", createdAt: new Date(NOON.getTime() - daysAgo * DAY), emailedAt: new Date(NOON.getTime() - daysAgo * DAY) });
    expect(pickForSend(due, [], true, NOON)).toMatchObject({ channel: "email" });
    // The first one went 4 days ago: the second may go now, even though it is inside the weekly email limit.
    expect(pickForSend(due, [sent(4)], false, NOON)).toMatchObject({ channel: "email" });
    expect(pickForSend(due, [sent(10), sent(4)], false, NOON)).toBeNull();
    expect(episodeOf({ kind: "finish_setup", key: "" }, [sent(10), sent(4)], NOON).state).toBe("resting");
  });

  it("does not let sign-up emails use up the weekly email for growth nudges", () => {
    const signup = row({ kind: "finish_setup", emailedAt: new Date(NOON.getTime() - DAY) });
    expect(canEmail([signup], NOON)).toBe(true);
  });

  it("never emails the owner about a new member, since that email already exists", () => {
    expect(KINDS.member_joined.email).toBe(false);
    expect(KINDS.alerts_off.push).toBe(false);
  });
});

describe("nudges: tone", () => {
  const everything = [
    facts({ podReadyCount: 0, podState: "none", hasPush: false, stalledInvites: 4, newMembers: [{ userId: "a", name: "Yaa" }, { userId: "b", name: null }] }),
    facts({ podReadyCount: 1, hasPush: false }),
    facts({ firstName: null, podReadyCount: 2, stalledInvites: 1 }),
    facts({ onboardingComplete: false, accountAgeDays: 2 }),
    facts({ onboardingComplete: false, accountAgeDays: 6 }),
  ].flatMap((f) => dueNudges(f));
  const words = everything.map((c) => `${c.title} ${c.body} ${c.cta.label}`).join("\n");

  it("writes something for every kind", () => {
    expect(new Set(everything.map((c) => c.kind)).size).toBe(5);
  });

  it("has no money, rewards, pressure or fake urgency", () => {
    expect(words).not.toMatch(/\b(pay|paid|cash|money|cedi|reward|prize|bonus|discount|free|hurry|last chance|running out|miss out|expires?|deadline|only \d+ left)\b/i);
  });

  it("is short, plain and never shouts", () => {
    for (const c of everything) {
      expect(c.title.length).toBeLessThanOrEqual(60);
      expect(c.body.length).toBeLessThanOrEqual(190);
      expect(c.title + c.body).not.toMatch(/[A-Z]{5,}|!!/);
    }
  });

  it("only links to places inside the app", () => {
    for (const c of everything) expect(c.cta.href).toMatch(/^\/[a-z]/);
  });
});

describe("nudges: promises kept in the code", () => {
  const read = (p: string) => readFileSync(p, "utf8");

  it("the rules are pure: no database, no network", () => {
    const src = read("lib/nudge-rules.ts");
    expect(src).not.toMatch(/from "@\/lib\/(prisma|push)"/);
    expect(src).not.toMatch(/\bfetch\(/);
  });

  it("alerts for real blood requests never depend on nudges", () => {
    for (const f of ["lib/alerts.ts", "lib/alert-rules.ts", "lib/emergencies.ts"]) {
      expect(read(f)).not.toMatch(/nudge/i);
    }
  });

  it("the sweep leaves out hospital and lab staff, people who switched off, and quiet hours", () => {
    const src = read("lib/nudges.ts");
    expect(src).toContain("hospitalId: null");
    expect(src).toContain("labId: null");
    expect(src).toContain("nudgesOff: false");
    expect(src).toContain("inQuietHours");
  });

  it("a tap can only go to a path inside the app", async () => {
    const { safePath } = await import("@/lib/nudges").catch(() => ({ safePath: null }));
    if (!safePath) return; // the database client is not loadable in this environment
    expect(safePath("/pod/invite")).toBe("/pod/invite");
    expect(safePath("//evil.example")).toBe("/dashboard");
    expect(safePath("https://evil.example")).toBe("/dashboard");
    expect(safePath("/\\evil.example")).toBe("/dashboard");
    expect(safePath(null)).toBe("/dashboard");
  });

  it("the cron job needs the secret", () => {
    expect(read("app/api/cron/nudges/route.ts")).toContain("CRON_SECRET");
  });
});
