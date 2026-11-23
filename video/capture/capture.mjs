// Captures real BloodPod screens at phone size for the tutorial video.
//
//   1. Start the app:            npm run dev        (in the repo root)
//   2. Capture public screens:   npm run capture    (in video/)
//
// Optional environment variables:
//   BASE_URL        default http://localhost:3000
//   INVITE_TOKEN    a live invite token, to capture the invite landing page
//   DEMO_EMAIL / DEMO_PASSWORD   a DEMO account (never a real person) to capture signed-in screens
//   CHROMIUM_PATH   path to a Chromium/Chrome executable, if the default is not found
//
// Safety: this script never submits the sign-up form and never clicks anything that
// writes data. Signed-in capture only reads pages. Use a demo account on a test
// database, because a local dev server uses whatever DATABASE_URL points at.

import { chromium } from "playwright-core";
import { existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, "..", "public", "screens");
mkdirSync(OUT, { recursive: true });

const BASE = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
// Credentials come from capture/.demo.json (written by seed-demo.mjs) unless set in the environment.
let demo = {};
try {
  demo = JSON.parse(readFileSync(join(here, ".demo.json"), "utf8"));
} catch {}
const INVITE_TOKEN = process.env.INVITE_TOKEN ?? demo.inviteToken;
const DEMO_EMAIL = process.env.DEMO_EMAIL ?? demo.ownerEmail;
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? demo.password;
const NEW_EMAIL = process.env.DEMO_NEW_EMAIL ?? demo.newUserEmail;

// Phone size. deviceScaleFactor 2 gives sharp 780x1688 images for the 1.62x video phone.
const VIEWPORT = { width: 390, height: 844 };

// Same fake values the video types in. Nothing here belongs to a real person.
const FAKE = { name: "Akosua Mensah", email: "akosua@example.com", phone: "024 123 4567", password: "demo-password-1" };

function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const root = join(process.env.PLAYWRIGHT_BROWSERS_PATH ?? join(homedir(), "AppData", "Local", "ms-playwright"));
  const alt = join(process.env.PLAYWRIGHT_BROWSERS_PATH ?? join(homedir(), ".cache", "ms-playwright"));
  for (const dir of [root, alt]) {
    if (!existsSync(dir)) continue;
    const found = readdirSync(dir).filter((d) => d.startsWith("chromium-")).sort().reverse()[0];
    if (!found) continue;
    for (const exe of [join(dir, found, "chrome-win64", "chrome.exe"), join(dir, found, "chrome-win", "chrome.exe"), join(dir, found, "chrome-linux", "chrome"), join(dir, found, "chrome-mac", "Chromium.app", "Contents", "MacOS", "Chromium")]) {
      if (existsSync(exe)) return exe;
    }
  }
  throw new Error("No Chromium found. Set CHROMIUM_PATH to a Chrome or Chromium executable.");
}

const FREEZE = `*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}
nextjs-portal,[data-nextjs-toast],[data-nextjs-dev-tools-button]{display:none!important}`;

const results = [];
async function shot(page, name, attempt = 1) {
  try {
    await page.waitForLoadState("load");
    await page.addStyleTag({ content: FREEZE });
    await page.evaluate(() => document.fonts.ready);
    // A dev server shows its own address in invite links. Swap it for the public one (or nothing)
    // so "localhost" never appears in a published video. Set VIDEO_PUBLIC_URL to your real domain.
    await page.evaluate((pub) => {
      const dev = /https?:\/\/localhost:\d+/g;
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) n.nodeValue = n.nodeValue.replace(dev, pub);
      document.querySelectorAll("input,textarea").forEach((el) => {
        if (dev.test(el.value)) el.value = el.value.replace(dev, pub);
      });
    }, (process.env.VIDEO_PUBLIC_URL ?? "").replace(/\/$/, ""));
  } catch (err) {
    // A redirect can land mid-call ("Execution context was destroyed"). Settle and retry once.
    if (attempt > 1) throw err;
    await page.waitForTimeout(3000);
    return shot(page, name, attempt + 1);
  }
  await page.waitForTimeout(250);
  const file = join(OUT, `${name}.png`);
  await page.screenshot({ path: file, timeout: 120_000 });
  results.push(name);
  console.log("captured", name);
}

async function open(page, path) {
  const res = await page.goto(`${BASE}${path}`, { waitUntil: "load", timeout: 240_000 });
  await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
  await page.waitForTimeout(1500);
  if (!res || !res.ok()) throw new Error(`${path} returned ${res?.status()}`);
}

const browser = await chromium.launch({ executablePath: findChromium() });
const context = await browser.newContext({
  viewport: VIEWPORT,
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  locale: "en-GH",
});
const page = await context.newPage();

try {
  // Public screens. Forms are filled with fake values and never submitted.
  await open(page, "/sign-up");
  await shot(page, "signup-empty");
  await page.fill("#name", FAKE.name);
  await page.fill("#email", FAKE.email);
  await page.fill("#phone", FAKE.phone);
  await page.fill("#password", FAKE.password);
  await shot(page, "signup-filled");

  await open(page, "/sign-in");
  await shot(page, "signin");

  if (INVITE_TOKEN) {
    await open(page, `/invite/${encodeURIComponent(INVITE_TOKEN)}`);
    await shot(page, "invite-landing");
  } else {
    console.log("skipped invite-landing (set INVITE_TOKEN)");
  }

  // Signed-in screens: read-only, demo account only.
  if (DEMO_EMAIL && DEMO_PASSWORD) {
    await open(page, "/sign-in");
    await page.fill("#email", DEMO_EMAIL);
    await page.fill("#password", DEMO_PASSWORD);
    await Promise.all([page.waitForURL((u) => !u.pathname.startsWith("/sign-in"), { timeout: 30_000 }), page.keyboard.press("Enter")]);
    for (const [path, name] of [
      ["/dashboard", "dashboard"],
      ["/pod", "pod"],
      ["/pod/invite", "pod-invite"],
      ["/pod/ready", "captain"],
    ]) {
      try {
        await open(page, path);
        await shot(page, name);
      } catch (err) {
        console.log(`skipped ${name}: ${err.message}`);
      }
    }
  } else {
    console.log("skipped signed-in screens (set DEMO_EMAIL and DEMO_PASSWORD for a demo account)");
  }
  // A demo user who has not finished onboarding. Only the first screen is captured here;
  // later steps write data, so they are captured separately on request.
  if (NEW_EMAIL && DEMO_PASSWORD) {
    const ctx2 = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: "en-GH" });
    const p2 = await ctx2.newPage();
    try {
      await p2.goto(`${BASE}/sign-in`, { waitUntil: "load", timeout: 240_000 });
      await p2.fill("#email", NEW_EMAIL);
      await p2.fill("#password", DEMO_PASSWORD);
      await Promise.all([p2.waitForURL((u) => !u.pathname.startsWith("/sign-in"), { timeout: 30_000 }), p2.keyboard.press("Enter")]);
      await p2.goto(`${BASE}/onboarding`, { waitUntil: "load", timeout: 240_000 });
      await shot(p2, "onboarding-first");
    } catch (err) {
      console.log(`skipped onboarding-first: ${err.message}`);
    }
    await ctx2.close();
  }
} finally {
  await browser.close();
}

console.log(`\nDone. ${results.length} screens in ${OUT}`);
