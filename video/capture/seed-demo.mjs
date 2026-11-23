// Creates a small, clearly fake demo dataset for capturing tutorial screens.
//
//   node --env-file=../.env.local capture/seed-demo.mjs        (run from video/)
//
// Creates: 1 Pod owner, 5 Pod members, 1 "new" user who has not finished onboarding,
// and one Pod with a share invite. Everything is tagged by the email pattern
// demo-video-*@example.com so capture/cleanup-demo.mjs can remove all of it.
//
// Auth users are created with the Supabase admin API and email_confirm: true, so no
// email is ever sent. Credentials are written to capture/.demo.json (gitignored).
// This does NOT touch any app setting or any other setting.

import { createRequire } from "node:module";
import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const rootRequire = createRequire(join(here, "..", "..", "package.json"));
const { PrismaClient } = rootRequire("@prisma/client");
const { createClient } = rootRequire("@supabase/supabase-js");

const { NEXT_PUBLIC_SUPABASE_URL: SB_URL, SUPABASE_SERVICE_ROLE_KEY: SB_KEY } = process.env;
if (!SB_URL || !SB_KEY || !process.env.DATABASE_URL) {
  throw new Error("Missing env. Run with: node --env-file=../.env.local --env-file=../.env capture/seed-demo.mjs");
}

const prisma = new PrismaClient();
const supabase = createClient(SB_URL, SB_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

const password = `Demo-${randomBytes(9).toString("base64url")}`;
const email = (k) => `demo-video-${k}@example.com`;

const OWNER = { key: "kofi", name: "Kofi Mensah", phone: "0244000001" };
const MEMBERS = [
  { key: "ama", name: "Ama Boateng", phone: "0244000002", bloodType: "A_POS" },
  { key: "yaw", name: "Yaw Asante", phone: "0244000003", bloodType: "O_POS" },
  { key: "esi", name: "Esi Owusu", phone: "0244000004", bloodType: "B_POS" },
  { key: "nii", name: "Nii Tetteh", phone: "0244000005", bloodType: "O_NEG" },
  { key: "efua", name: "Efua Darko", phone: "0244000006", bloodType: "AB_POS" },
];
const NEWBIE = { key: "akosua", name: "Akosua Mensah", phone: "0244000007" };

async function authUser(key, name) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: email(key),
    password,
    email_confirm: true,
    user_metadata: { name },
  });
  if (error) throw new Error(`auth ${key}: ${error.message}`);
  return data.user.id;
}

const done = { donationInfoAt: new Date(), emergencyConsentAt: new Date(), phoneVerifiedAt: new Date() };
const accra = { city: "Accra", location: "Accra", latitude: 5.6037, longitude: -0.187 };

const ownerId = await authUser(OWNER.key, OWNER.name);
const owner = await prisma.user.create({
  data: {
    supabaseId: ownerId,
    email: email(OWNER.key),
    name: OWNER.name,
    phone: OWNER.phone,
    bloodType: "O_POS",
    onboardingComplete: true,
    onboardingStep: 7,
    isAvailable: false,
    isPublic: false,
    ...done,
    ...accra,
  },
});

const pod = await prisma.pod.create({ data: { name: "Mensah Family", slug: "demo-video-mensah-family", ownerId: owner.id } });

for (const m of MEMBERS) {
  const id = await authUser(m.key, m.name);
  const u = await prisma.user.create({
    data: {
      supabaseId: id,
      email: email(m.key),
      name: m.name,
      phone: m.phone,
      bloodType: m.bloodType,
      onboardingComplete: true,
      onboardingStep: 7,
      ...done,
      ...accra,
    },
  });
  await prisma.podMember.create({ data: { podId: pod.id, userId: u.id, invitedById: owner.id } });
}

const code = Array.from({ length: 6 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");
const invite = await prisma.podInvite.create({
  data: { podId: pod.id, senderId: owner.id, kind: "SHARE", code, expiresAt: new Date(Date.now() + 365 * 864e5) },
});

// A user partway through sign-up, for the onboarding screens.
const newId = await authUser(NEWBIE.key, NEWBIE.name);
// Real sign-up always creates the user a starter Pod (see api/auth/complete-signup),
// and the onboarding page redirects anyone without one, so the demo user gets one too.
await prisma.user.create({
  data: {
    supabaseId: newId,
    email: email(NEWBIE.key),
    name: NEWBIE.name,
    phone: NEWBIE.phone,
    onboardingComplete: false,
    onboardingStep: 0,
    ownedPods: { create: { name: "Akosua's Pod", slug: "demo-video-akosua" } },
  },
});

writeFileSync(
  join(here, ".demo.json"),
  JSON.stringify({ password, ownerEmail: email(OWNER.key), newUserEmail: email(NEWBIE.key), inviteToken: invite.token, inviteCode: invite.code }, null, 2),
);

console.log(`Seeded ${MEMBERS.length + 2} demo users and Pod "${pod.name}". Credentials in capture/.demo.json`);
await prisma.$disconnect();
