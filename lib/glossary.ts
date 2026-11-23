import { ELIGIBILITY_MONTHS } from "@/lib/eligibility";
import { FREE_POD_MEMBER_LIMIT } from "@/lib/pod-limits";

/**
 * What the app means by its own words, in one place. The ⓘ buttons read from here, so a term is explained the
 * same way on every screen. Plain sentences, no jargon, and only what is true of how the app works today.
 */
export interface GlossaryEntry {
  title: string;
  body: string;
}

export const GLOSSARY = {
  eligible: {
    title: "Eligible",
    body: `Eligible means enough time has passed since your last donation for your body to recover. BloodPod uses ${ELIGIBILITY_MONTHS} months. You are only counted on when you are eligible.`,
  },
  pod: {
    title: "Your Pod",
    body: `Your Pod is the group of people you trust, up to ${FREE_POD_MEMBER_LIMIT}. When blood is needed, they can be asked together.`,
  },
  podReady: {
    title: "Pod ready",
    body: "A Pod is ready once 3 people in it can donate right now. Until then it is still building: add people, or wait for others to be eligible again.",
  },
  bloom: {
    title: "Bloom and Seedling",
    body: "A bloom is someone who is ready to donate. A seedling is someone resting after a recent donation, who will bloom again once they are eligible.",
  },
  bloodCard: {
    title: "Blood Card",
    body: "Your Blood Card shows your blood group and your donation record. It works without a connection, so you can show it at a clinic.",
  },
  passportTier: {
    title: "Passport tiers",
    body: "Your tier grows with the donations you log: Starter at 0 to 4, Verified at 5 to 24, and Legend at 25 and over.",
  },
  verified: {
    title: "Verified",
    body: "A donation is verified once a hospital or lab has confirmed it. Until then it is self-reported: still yours, just not confirmed.",
  },
  discover: {
    title: "Who sees you in Discover",
    body: "Everyone can appear in Discover without a name. If you choose to be listed, people see your first name and can ask for your help. Your full name and phone number are shared only when you say yes to a request.",
  },
  ask: {
    title: "Asking for help",
    body: "Asking sends a donor a short request. They can say yes or no. Only if they say yes do you both see each other's full name and phone number.",
  },
  drill: {
    title: "Practice drill",
    body: "A practice alert you send to your own Pod to see whether people would answer. It is clearly marked, it is never a real emergency, and answering is optional.",
  },
  carePod: {
    title: "Care Pod",
    body: "A Care Pod is for one patient who needs blood again and again, such as someone with sickle cell. It tracks the next transfusion date and a rota of donors who can give.",
  },
  medicalId: {
    title: "Medical ID",
    body: "An image with your blood group, allergies and emergency contact, made for your phone's lock screen. It stays with you. We do not share it with anyone.",
  },
  alerts: {
    title: "Emergency alerts",
    body: "Alerts reach your phone when someone near you needs your blood type. You can answer yes or no, and you can turn them off at any time.",
  },
  soon: {
    title: "Coming soon",
    body: "This is planned but not ready yet. You are never charged for something that is not there.",
  },
} as const satisfies Record<string, GlossaryEntry>;

export type TermId = keyof typeof GLOSSARY;
