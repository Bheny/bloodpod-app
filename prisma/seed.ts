import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ARTICLES = [
  {
    slug: "who-can-donate-blood",
    title: "Who can actually donate blood?",
    excerpt: "The basic eligibility rules, in plain language — no medical degree required.",
    category: "FAQ" as const,
    body: `Most healthy adults between 18 and 65 can donate blood. The core requirements: you weigh at least 50kg, you feel well on the day, and you haven't donated in the last 90 days.

A few things temporarily rule you out: a cold or fever in the last 48 hours, pregnancy or having given birth in the last 6 months, a tattoo or piercing in the last 4 months from an unlicensed studio, or taking certain antibiotics.

If you're not sure whether something disqualifies you, the honest answer is usually "probably not, but ask the clinic anyway." Most minor conditions — a headache, a old scar, being on birth control — don't affect eligibility at all.

The single biggest reason people who are eligible never donate isn't a medical issue. It's that nobody ever asked them directly. That's the gap BloodPod exists to close.`,
  },
  {
    slug: "before-you-donate",
    title: "What to do the day before you donate",
    excerpt: "Three small habits that make donation easier and faster to recover from.",
    category: "TIP" as const,
    body: `Donating blood is routine for your body, but a little preparation makes it noticeably easier.

Sleep. Aim for a full night's sleep before your appointment. Tired bodies feel donation more.

Hydrate. Drink an extra glass or two of water in the hours before you go. Your blood volume recovers faster when you start hydrated.

Eat first. Never donate on an empty stomach. A proper meal within a few hours of donating significantly reduces the chance of feeling lightheaded afterward.

That's really it. No special diet, no fasting, no supplements required. Show up rested, hydrated, and fed, and the actual donation will be the easiest part of your day.`,
  },
  {
    slug: "what-happens-when-you-donate",
    title: "What actually happens when you donate",
    excerpt: "A step-by-step walkthrough for first-timers who aren't sure what to expect.",
    category: "ARTICLE" as const,
    featured: true,
    body: `If you've never donated before, the uncertainty is often scarier than the process itself. Here's exactly what happens.

First, a quick health screening: your temperature, blood pressure, pulse, and a small finger-prick to check your hemoglobin level. This takes a few minutes and is mostly just questions.

Then the donation itself. A trained phlebotomist inserts a single needle into a vein in your arm — this is the only part that involves any discomfort, and it's brief. Drawing roughly 470ml of blood (less than 10% of what's in your body) takes 8 to 10 minutes.

Afterward, you rest for 10–15 minutes with a snack and something to drink. This isn't optional — it's how your body adjusts before you go back to your day.

Most people are back to normal activity within hours. The blood volume itself replaces within 24–48 hours; the red cells take a few weeks, which is part of why there's a 90-day wait between donations.`,
  },
  {
    slug: "iron-and-donation-frequency",
    title: "Why there's a 90-day wait between donations",
    excerpt: "It's about iron, not bureaucracy. Here's the actual reason.",
    category: "FAQ" as const,
    body: `The 90-day rule isn't arbitrary — it's about giving your body enough time to rebuild iron stores.

Iron is what your bone marrow uses to build new red blood cells. Every donation uses up some of your stored iron along with the blood itself. Most people replace the fluid and plasma within two days, but rebuilding the iron and red blood cells fully takes closer to two to three months.

Donate too frequently and you risk iron-deficiency anemia — which ironically would make you ineligible to donate at all, and leaves you feeling tired and run down in daily life.

If you're a frequent donor, eating iron-rich foods (red meat, leafy greens, beans, fortified cereals) between donations helps your body recover faster and keeps you eligible on schedule.`,
  },
  {
    slug: "blood-type-compatibility-explained",
    title: "Blood type compatibility, explained simply",
    excerpt: "Why O− is everyone's emergency backup, and why AB+ can receive from anyone.",
    category: "ARTICLE" as const,
    featured: true,
    body: `Blood types matter because your immune system attacks blood markers it doesn't recognize. Getting this wrong in a transfusion is dangerous — which is why hospitals are strict about matching.

O− has no A, B, or Rh markers at all, so any blood type can receive it without conflict. That's why it's called the universal donor type, and why it's used in emergencies when there's no time to test the patient's exact type. It's also rare — only a small share of any population has it — which is why O− donors are disproportionately valuable.

AB+ is the mirror image: it has every marker, so an AB+ person can receive blood from any type. But AB+ donations can only safely go to other AB+ patients.

Everyone else falls somewhere in between. Knowing your own type — and your pod's coverage across types — is exactly what BloodPod's passport and pod strength score are built around.`,
  },
  {
    slug: "common-blood-donation-myths",
    title: "Five blood donation myths, debunked",
    excerpt: "\"It'll hurt for days\" and other things that just aren't true.",
    category: "TIP" as const,
    body: `Myth 1: "It's very painful." The needle insertion is a brief pinch. Most people describe the donation itself as uneventful.

Myth 2: "You'll feel weak for days." A short rest period and normal eating typically has people back to regular activity, including light exercise, the same day.

Myth 3: "Donating too often weakens your immune system." Blood donation doesn't meaningfully affect your immune system. The 90-day spacing rule is about iron and red cell recovery, not immunity.

Myth 4: "If I'm on medication, I can't donate." Most common medications — blood pressure treatment, birth control, allergy medication — don't disqualify you. A small number do, but it's the exception, not the rule.

Myth 5: "My blood type isn't needed." Every type is needed somewhere, every day. Rarer types are needed more urgently, but hospitals need a steady supply of all of them, all the time.`,
  },
  {
    slug: "why-90-seconds-matters",
    title: "Why response time is the real emergency",
    excerpt: "It's rarely the lack of blood. It's how long it takes to find the right donor.",
    category: "ARTICLE" as const,
    featured: true,
    body: `When someone needs blood urgently, the blood usually exists somewhere nearby. The actual emergency is almost always speed: finding a compatible, eligible, willing donor fast enough.

In Ghana, the average search for a compatible donor during an emergency can take hours — phone calls to family, friends, friends of friends, often starting from zero. Every one of those hours is spent on logistics, not medicine.

This is the exact gap a pod is designed to close. When your circle already knows their blood type, already knows they're in your network, and gets an alert the moment it matters, the search that used to take hours can take minutes.

The technology here isn't complicated. It's just organizing what already exists — people who are willing to help — before the moment you need them, instead of after.`,
  },
  {
    slug: "hydration-and-recovery",
    title: "The fastest way to recover after donating",
    excerpt: "Hydration matters more than almost anything else you can do.",
    category: "TIP" as const,
    body: `Of everything that affects how you feel after donating, hydration has the biggest, most immediate effect.

Blood plasma is mostly water, and it's the first thing your body replaces after a donation — usually within 24 hours, faster if you're drinking enough. Dehydration is also the single most common cause of feeling lightheaded post-donation, more so than the blood loss itself.

For the rest of the day after donating: drink more water than usual, go easy on alcohol, and avoid intense exercise or heavy lifting for a few hours. None of this is about being fragile — it's just giving your circulatory system a few hours to fully rebalance.

Most donors who follow this feel completely normal within a few hours and back to full activity the next day.`,
  },
];

const PARTNERS = [
  {
    name: "Accra General Hospital",
    type: "HOSPITAL" as const,
    city: "Accra",
    description: "Emergency and trauma care partner accepting verified donations.",
  },
  {
    name: "Kumasi Community Blood Bank",
    type: "BLOOD_BANK" as const,
    city: "Kumasi",
    description: "Regional blood bank coordinating supply across Ashanti clinics.",
  },
  {
    name: "Tema Regional Diagnostic Lab",
    type: "LAB" as const,
    city: "Tema",
    description: "Blood typing and screening lab for donor verification.",
  },
  {
    name: "Cape Coast Medical Centre",
    type: "HOSPITAL" as const,
    city: "Cape Coast",
    description: "Maternity and surgical hospital with ongoing donor needs.",
  },
  {
    name: "Sunyani District Blood Bank",
    type: "BLOOD_BANK" as const,
    city: "Sunyani",
    description: "Serves district hospitals across the Bono region.",
  },
  {
    name: "Ho Teaching Clinic",
    type: "HOSPITAL" as const,
    city: "Ho",
    description: "Teaching hospital partner for the Volta region.",
  },
];

async function main() {
  for (const article of ARTICLES) {
    await prisma.article.upsert({
      where: { slug: article.slug },
      update: {},
      create: article,
    });
  }
  console.log(`Seeded ${ARTICLES.length} articles.`);

  const existingPartners = await prisma.partner.count();
  if (existingPartners === 0) {
    await prisma.partner.createMany({ data: PARTNERS });
    console.log(`Seeded ${PARTNERS.length} partners.`);
  } else {
    console.log("Partners already seeded, skipping.");
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
