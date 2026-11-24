/**
 * WhatsApp click-to-chat for admins: opens a chat with a person, with a friendly message already written.
 * It costs nothing and sends nothing by itself: the admin sees the message, can change it, and presses send.
 * Pure, so it can be tested.
 */

/** International digits for wa.me. Ghana numbers written with a leading 0 become 233... */
export function waNumber(phone: string | null | undefined): string | null {
  let d = (phone ?? "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  else if (d.startsWith("0")) d = `233${d.slice(1)}`;
  return d.length >= 9 && d.length <= 15 ? d : null;
}

export function whatsappUrl(phone: string | null | undefined, text: string): string | null {
  const n = waNumber(phone);
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : null;
}

export interface OutreachTemplate {
  id: string;
  label: string;
  /** When an admin would pick this one. */
  when: string;
  text: (firstName: string | null) => string;
}

const hello = (n: string | null) => (n ? `Hello ${n},` : "Hello,");
const sign = "This is BloodPod, the app that helps people find blood fast through people they trust.";

/**
 * Kind and plain. Education, not accusation: nothing here says who reported anyone, and nothing threatens.
 * Written so a person who made an honest mistake feels welcome, and one who did not still knows the rules.
 */
export const OUTREACH_TEMPLATES: OutreachTemplate[] = [
  {
    id: "finish_setup",
    label: "Help finish setting up",
    when: "Stuck in onboarding",
    text: (n) =>
      `${hello(n)} ${sign} We saw you started setting up but did not finish. It takes about two minutes, and until it is done your Pod cannot count on you. Is something unclear? Reply here and I will help you through it.`,
  },
  {
    id: "real_details",
    label: "Why real details matter",
    when: "Details look fake, or a gentle check-in",
    text: (n) =>
      `${hello(n)} ${sign} We are checking that the details on every account are real, because when someone needs blood, people have to be able to trust each other. Could you check that your name, phone number and blood type on your profile are correct? Your number is only shared with someone when you say yes to their request.`,
  },
  {
    id: "no_payment",
    label: "Our one rule: no payment",
    when: "Someone asked for or offered money",
    text: (n) =>
      `${hello(n)} ${sign} A reminder of our one rule: blood on BloodPod is always given freely. Nobody pays for it and nobody is paid for it. Everyone agrees to this when they join. If you ever feel pushed to break it, please tell us here.`,
  },
  {
    id: "showing_up",
    label: "Showing up",
    when: "Said yes and did not come",
    text: (n) =>
      `${hello(n)} ${sign} When you tap "I can come", someone is waiting for you. If your plans change, that is fine, just tap "I can't" or call them so they can look elsewhere. Thank you for being someone your Pod can count on.`,
  },
  {
    id: "alerts_on",
    label: "Turn alerts on",
    when: "Alerts are off",
    text: (n) =>
      `${hello(n)} ${sign} Your phone alerts are off, so you would be the last to hear if your Pod needed you. It takes about ten seconds: open BloodPod, go to Notifications and switch alerts on. Want me to walk you through it?`,
  },
  {
    id: "start_pod",
    label: "Start or grow a Pod",
    when: "Pod is empty or thin",
    text: (n) =>
      `${hello(n)} ${sign} A Pod is just a few people you trust, like family or close friends, who agree to show up for each other. Three people is where it starts to answer fast. Who is the first person you would ask? You can invite them from the app in a minute.`,
  },
];

export const TEMPLATE_IDS = OUTREACH_TEMPLATES.map((t) => t.id);
