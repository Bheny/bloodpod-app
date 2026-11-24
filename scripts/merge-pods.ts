/**
 * One Pod per donor, step M2: merge each owner's Pods into one.
 *
 *   npm run pods:merge                                 shows what it WOULD do, changes nothing
 *   npm run pods:merge -- --apply --i-have-a-backup    does it
 *
 * Read the dry run first. The merge cannot be undone without a database backup, so --apply refuses to run
 * without --i-have-a-backup. Each owner is merged in its own transaction: if one fails, that owner is
 * left exactly as they were and the rest carry on. A JSON log of every Pod removed is written next to
 * where you run it (pod-merge-log-*.json). Do not commit that file.
 */
import { writeFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { planMerges, type MergePodIn, type OwnerPlan } from "../lib/pod-merge";
import type { PodCategoryId } from "../lib/pod-categories";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");
const backedUp = process.argv.includes("--i-have-a-backup");

async function load(): Promise<MergePodIn[]> {
  const pods = await prisma.pod.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      ownerId: true,
      createdAt: true,
      slotLimit: true,
      members: { select: { id: true, userId: true, category: true } },
    },
  });
  return pods.map((p) => ({ ...p, members: p.members.map((m) => ({ ...m, category: m.category as PodCategoryId })) }));
}

function describe(plan: OwnerPlan, names: Map<string, string>): string {
  const lines = [
    `Owner ${names.get(plan.ownerId) ?? plan.ownerId}`,
    `  keeps   "${plan.survivorName}" (${plan.survivorId})`,
    ...plan.removed.map((r) => `  merges  "${r.name}" (${r.id}), guessed category: ${r.guess}`),
    `  moves ${plan.moves.length} people, drops ${plan.duplicates.length} duplicates, recategorises ${plan.recategorised.length}`,
    `  people afterwards: ${plan.peopleAfter}${plan.newSlotLimit ? `, slot limit raised to ${plan.newSlotLimit}` : ""}`,
  ];
  const left = plan.moves.filter((m) => m.category === "OTHER").length;
  if (left > 0) lines.push(`  ${left} of the moved people will be filed as Other (the old Pod name did not say)`);
  return lines.join("\n");
}

async function applyOwner(plan: OwnerPlan, removedMeta: { id: string; name: string; slug: string }[], guesses: Map<string, PodCategoryId>) {
  const removedIds = plan.removed.map((r) => r.id);
  await prisma.$transaction(
    async (tx) => {
      // 1. People already in the survivor who get a better category.
      for (const r of plan.recategorised) await tx.podMember.update({ where: { id: r.memberId }, data: { category: r.category } });
      // 2. Duplicates go.
      if (plan.duplicates.length) await tx.podMember.deleteMany({ where: { id: { in: plan.duplicates.map((d) => d.memberId) } } });
      // 3. Everyone else moves in.
      for (const m of plan.moves) await tx.podMember.update({ where: { id: m.memberId }, data: { podId: plan.survivorId, category: m.category } });
      // 4. Invites keep their links and codes: they move to the survivor, and an old Pod's links file people by that Pod's name.
      for (const id of removedIds) {
        await tx.podInvite.updateMany({ where: { podId: id, category: "OTHER" }, data: { category: guesses.get(id) ?? "OTHER" } });
        await tx.podInvite.updateMany({ where: { podId: id }, data: { podId: plan.survivorId } });
      }
      // 5. Everything else that points at a removed Pod.
      await tx.drill.updateMany({ where: { podId: { in: removedIds } }, data: { podId: plan.survivorId } });
      await tx.bloodRequest.updateMany({ where: { podId: { in: removedIds } }, data: { podId: plan.survivorId } });
      await tx.careProfile.updateMany({ where: { podId: { in: removedIds } }, data: { podId: plan.survivorId } });
      await tx.pod.updateMany({ where: { parentPodId: { in: removedIds } }, data: { parentPodId: plan.survivorId } });
      // 6. The survivor takes the freshest activity and any slots it needs.
      const all = await tx.pod.findMany({ where: { id: { in: [plan.survivorId, ...removedIds] } }, select: { lastActivityAt: true } });
      const latest = all.map((p) => p.lastActivityAt?.getTime() ?? 0).reduce((a, b) => Math.max(a, b), 0);
      await tx.pod.update({
        where: { id: plan.survivorId },
        data: { ...(plan.newSlotLimit ? { slotLimit: plan.newSlotLimit } : {}), ...(latest ? { lastActivityAt: new Date(latest) } : {}) },
      });
      // 7. The emptied Pods are removed.
      await tx.pod.deleteMany({ where: { id: { in: removedIds } } });
    },
    { timeout: 60_000, maxWait: 15_000 },
  );
  return removedMeta;
}

async function main() {
  const pods = await load();
  const plans = planMerges(pods);
  const owners = await prisma.user.findMany({ where: { id: { in: plans.map((p) => p.ownerId) } }, select: { id: true, name: true } });
  const names = new Map(owners.map((o) => [o.id, o.name ?? "(no name)"]));

  console.log(`${pods.length} Pods in total. ${plans.length} owner(s) have more than one.\n`);
  if (plans.length === 0) {
    console.log("Nothing to merge. You can add the one-Pod-per-owner rule now (prisma/pending/one_pod_per_owner).");
    return;
  }
  for (const plan of plans) console.log(describe(plan, names) + "\n");

  if (!apply) {
    console.log("Dry run: nothing was changed. To do it: npm run pods:merge -- --apply --i-have-a-backup");
    return;
  }
  if (!backedUp) {
    console.error("Refusing to apply without --i-have-a-backup. Back up the database first, then add that flag.");
    process.exitCode = 1;
    return;
  }

  const meta = await prisma.pod.findMany({ where: { id: { in: plans.flatMap((p) => p.removed.map((r) => r.id)) } }, select: { id: true, name: true, slug: true } });
  const log: unknown[] = [];
  let failed = 0;
  for (const plan of plans) {
    try {
      const guesses = new Map(plan.removed.map((r) => [r.id, r.guess]));
      const removedMeta = meta.filter((m) => plan.removed.some((r) => r.id === m.id));
      await applyOwner(plan, removedMeta, guesses);
      log.push({ ownerId: plan.ownerId, survivorId: plan.survivorId, removed: removedMeta, moved: plan.moves.length, duplicates: plan.duplicates.length });
      console.log(`merged  ${names.get(plan.ownerId) ?? plan.ownerId}`);
    } catch (e) {
      failed++;
      console.error(`FAILED  ${names.get(plan.ownerId) ?? plan.ownerId}: ${e instanceof Error ? e.message : e} (left unchanged)`);
    }
  }
  const file = `pod-merge-log-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  writeFileSync(file, JSON.stringify(log, null, 2));
  console.log(`\nDone. ${plans.length - failed} merged, ${failed} failed. Log: ${file}`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
