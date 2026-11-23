// Removes everything seed-demo.mjs created: users whose email matches
// demo-video-*@example.com, their Pod, invites, memberships and auth accounts.
//
//   node --env-file=../.env.local --env-file=../.env capture/cleanup-demo.mjs   (from video/)

import { createRequire } from "node:module";
import { existsSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const rootRequire = createRequire(join(here, "..", "..", "package.json"));
const { PrismaClient } = rootRequire("@prisma/client");
const { createClient } = rootRequire("@supabase/supabase-js");

const prisma = new PrismaClient();
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const users = await prisma.user.findMany({
  where: { email: { startsWith: "demo-video-", endsWith: "@example.com" } },
  select: { id: true, supabaseId: true, email: true },
});
const ids = users.map((u) => u.id);
const pods = await prisma.pod.findMany({ where: { ownerId: { in: ids } }, select: { id: true } });
const podIds = pods.map((p) => p.id);

await prisma.podInvite.deleteMany({ where: { OR: [{ podId: { in: podIds } }, { senderId: { in: ids } }] } });
await prisma.podMember.deleteMany({ where: { OR: [{ podId: { in: podIds } }, { userId: { in: ids } }] } });
await prisma.pod.deleteMany({ where: { id: { in: podIds } } });
await prisma.activity.deleteMany({ where: { userId: { in: ids } } });
await prisma.donation.deleteMany({ where: { userId: { in: ids } } });
await prisma.bloodRequest.deleteMany({ where: { requesterId: { in: ids } } });
await prisma.user.deleteMany({ where: { id: { in: ids } } });

for (const u of users) {
  const { error } = await supabase.auth.admin.deleteUser(u.supabaseId);
  if (error) console.log(`auth delete failed for ${u.email}: ${error.message}`);
}

const creds = join(here, ".demo.json");
if (existsSync(creds)) unlinkSync(creds);
console.log(`Removed ${users.length} demo users and ${podIds.length} Pod(s).`);
await prisma.$disconnect();
