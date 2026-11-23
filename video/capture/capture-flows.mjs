// Captures the screens that need real clicks: onboarding and a drill. These WRITE data,
// so they run only against the demo accounts made by seed-demo.mjs (capture/.demo.json).
//
//   node --env-file=../.env.local --env-file=../.env capture/capture-flows.mjs [onboarding|drill]   (from video/)
//
// onboarding: walks the half-onboarded demo user through each step.
// drill:      the demo Pod owner starts a drill, one demo member answers in the app, three more
//             answers are written directly, and the drill's start time is moved back so its
//             10-minute window is over and the app shows the real result.

import { chromium } from "playwright-core";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, "..", "public", "screens");
mkdirSync(OUT, { recursive: true });
const BASE = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const which = process.argv[2] ?? "all";

const demo = JSON.parse(readFileSync(join(here, ".demo.json"), "utf8"));
for (const e of [demo.ownerEmail, demo.newUserEmail]) {
  if (!/^demo-video-.+@example\.com$/.test(e)) throw new Error("Refusing to run: not a demo account.");
}
const memberEmail = (k) => `demo-video-${k}@example.com`;

function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const dir = process.env.PLAYWRIGHT_BROWSERS_PATH ?? join(homedir(), "AppData", "Local", "ms-playwright");
  const found = readdirSync(dir).filter((d) => d.startsWith("chromium-")).sort().reverse()[0];
  for (const exe of ["chrome-win64/chrome.exe", "chrome-win/chrome.exe", "chrome-linux/chrome"]) {
    if (existsSync(join(dir, found, exe))) return join(dir, found, exe);
  }
  throw new Error("No Chromium found. Set CHROMIUM_PATH.");
}

const FREEZE = `*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}
nextjs-portal,[data-nextjs-toast],[data-nextjs-dev-tools-button]{display:none!important}`;

const browser = await chromium.launch({ executablePath: findChromium() });
const newPage = async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: "en-GH" });
  const page = await ctx.newPage();
  page.setDefaultTimeout(120_000);
  return page;
};

async function shot(page, name, attempt = 1) {
  try {
    await page.waitForLoadState("load");
    await page.addStyleTag({ content: FREEZE });
    await page.evaluate(() => document.fonts.ready);
  } catch (err) {
    if (attempt > 1) throw err;
    await page.waitForTimeout(3000);
    return shot(page, name, attempt + 1);
  }
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(OUT, `${name}.png`), timeout: 120_000 });
  console.log("captured", name);
}

async function settle(page) {
  await page.waitForLoadState("load");
  await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
  await page.waitForTimeout(1200);
}

async function login(page, email) {
  await page.goto(`${BASE}/sign-in`, { waitUntil: "load", timeout: 240_000 });
  await page.fill("#email", email);
  await page.fill("#password", demo.password);
  await Promise.all([page.waitForURL((u) => !u.pathname.startsWith("/sign-in"), { timeout: 120_000 }), page.keyboard.press("Enter")]);
  await settle(page);
}

const text = (page) => page.locator("body").innerText();
const primary = (page) => page.locator("button:not([disabled]):visible").last();

async function onboarding() {
  const page = await newPage();
  await login(page, demo.newUserEmail);
  await page.goto(`${BASE}/onboarding`, { waitUntil: "load", timeout: 240_000 });
  await settle(page);

  const seen = new Set();
  let slide = 0;
  for (let i = 0; i < 16; i++) {
    const t = await text(page);
    let step;
    if (/What.s your blood type/i.test(t)) step = "bloodtype";
    else if (/About you/i.test(t)) step = "details";
    else if (/You.re in/i.test(t) && /Start my network/i.test(t)) step = "youre-in";
    else if (/When did you last donate/i.test(t)) step = "lastdonated";
    else if (/Where are you\?/i.test(t) || /Help the people near you/i.test(t)) step = "location";
    else if (/exactly what you.re agreeing/i.test(t)) step = "consent";
    else if (/Who will you build it with/i.test(t)) step = "podname";
    else if (/Your Pod has 1 member/i.test(t)) step = "invite";
    else if (/Alerts are how you hear/i.test(t)) step = "alerts";
    else if (slide < 4) step = `welcome-${++slide}`; // multi-slide intro: Skip / Back / Next
    else throw new Error(`Unknown onboarding screen. Page text: ${t.replace(/\s+/g, " ").slice(0, 500)}`);

    if (step.startsWith("welcome")) console.log(`  [${step}]`, t.replace(/\s+/g, " ").slice(0, 160));
    if (seen.has(step)) throw new Error(`Stuck on onboarding step "${step}". Page text: ${t.replace(/\s+/g, " ").slice(0, 400)}`);
    seen.add(step);
    await shot(page, `onb-${step}`);

    if (step === "invite" || step === "alerts" || step === "youre-in") break; // stop before notification permission prompts

    if (step === "bloodtype") {
      await page.getByRole("button", { name: /^O\+(\s|$)/ }).first().click();
    } else if (step === "details") {
      const never = page.locator('input[type="checkbox"]').first();
      if (await never.count()) await never.check().catch(() => {});
    } else if (step === "lastdonated") {
      await page.getByText("Never", { exact: true }).first().click();
    } else if (step === "location") {
      await page.locator("input:visible").first().fill("Accra");
      await shot(page, "onb-location-city");
    } else if (step === "consent") {
      await page.getByText(/I agree to be contacted/i).click();
      await shot(page, "onb-consent-agreed");
    } else if (step === "podname") {
      await page.getByRole("button", { name: /^Family$/ }).first().click().catch(() => {});
      await page.getByLabel("Pod name").fill("Mensah Family");
      await shot(page, "onb-podname-filled");
    }

    await primary(page).click();
    await page.waitForTimeout(2500);
    await settle(page);
    if (!page.url().includes("/onboarding")) {
      console.log("left onboarding, now at", page.url());
      await shot(page, "onb-finished");
      break;
    }
  }
  console.log("onboarding walked:", [...seen].join(" > "));
}

async function drill() {
  const { PrismaClient } = createRequire(join(here, "..", "..", "package.json"))("@prisma/client");
  const prisma = new PrismaClient();

  // Start clean: remove earlier drills of the DEMO Pod only (responses cascade), so the
  // one-drill-a-week limit does not block a re-run.
  await prisma.drill.deleteMany({ where: { pod: { owner: { email: demo.ownerEmail } } } });

  const owner = await newPage();
  await login(owner, demo.ownerEmail);
  await owner.goto(`${BASE}/pod/ready`, { waitUntil: "load", timeout: 240_000 });
  await settle(owner);
  await owner.getByRole("button", { name: /Run a drill/i }).click();
  await owner.waitForURL(/\/pod\/ready\/drill\//, { timeout: 120_000, waitUntil: "commit" });
  await settle(owner);
  const drillId = owner.url().split("/pod/ready/drill/")[1].split(/[?#]/)[0];
  await shot(owner, "drill-owner-open");

  // Four members answer through the real UI. Ama's screens are captured.
  for (const key of ["ama", "yaw", "esi", "nii"]) {
    const m = await newPage();
    await login(m, memberEmail(key));
    await m.goto(`${BASE}/pod/ready/drill/${drillId}`, { waitUntil: "load", timeout: 240_000 });
    await settle(m);
    if (key === "ama") await shot(m, "drill-member");
    await m.getByRole("button", { name: /I am here/i }).click();
    await m.getByText(/Thank you, you are here/i).waitFor({ timeout: 120_000 });
    if (key === "ama") await shot(m, "drill-member-done");
    await m.context().close();
  }

  await owner.goto(`${BASE}/pod/ready/drill/${drillId}`, { waitUntil: "load", timeout: 240_000 });
  await settle(owner);
  await shot(owner, "drill-owner-answering");

  // The only shortcut: move the start time back so the 10-minute window is over. The counts
  // and the pass/fail result are the app's own.
  await prisma.drill.update({ where: { id: drillId }, data: { startedAt: new Date(Date.now() - 12 * 60_000) } });
  await prisma.$disconnect();

  await owner.goto(`${BASE}/pod/ready/drill/${drillId}`, { waitUntil: "load", timeout: 240_000 });
  await settle(owner);
  await shot(owner, "drill-result");
  console.log("drill id", drillId);
}

try {
  if (which === "all" || which === "onboarding") await onboarding();
  if (which === "all" || which === "drill") await drill();
} finally {
  await browser.close();
}
