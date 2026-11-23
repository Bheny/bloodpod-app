import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/legal/LegalPage";
import { CONTACT_EMAIL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Use | BloodPod",
  description: "The rules for using BloodPod, in plain language.",
};

const SECTIONS: LegalSection[] = [
  {
    title: "What BloodPod is, and what it is not",
    body: [
      "BloodPod is a tool that helps willing blood donors, their families, hospitals and laboratories find and look out for each other in Ghana.",
      "BloodPod is not a hospital, a blood bank, a laboratory or a medical provider. We do not collect, store, test or supply blood, and we do not give medical advice. Any blood donation or medical test happens at a licensed facility, under that facility's own rules.",
    ],
    bullets: [
      "Blood types, eligibility and health details on BloodPod are what people tell us. They are self-reported unless a card is marked \"Lab-verified\".",
      "BloodPod information never replaces a hospital's own testing, screening or clinical judgement.",
      "In an emergency, contact a hospital or the national blood service directly. Do not rely on BloodPod alone.",
    ],
  },
  {
    title: "Who can use it",
    body: [
      "You must be 18 or older and able to make your own decisions to create an account. You agree that the information you give us is true and that you will keep it up to date.",
      "Keep your sign-in details to yourself. You are responsible for what happens under your account.",
    ],
  },
  {
    title: "Donating blood",
    bullets: [
      "Donating is voluntary and unpaid. You must never sell blood, or ask or pay anyone to donate.",
      "You are responsible for judging whether you are well enough and eligible to donate, and for answering the hospital's screening questions honestly.",
      "A donor may say no to any request at any time, without giving a reason.",
      "Everyone on BloodPod makes the same promise: I will never ask for, offer or accept payment for donating blood.",
    ],
  },
  {
    title: "Pods",
    body: [
      "A Pod is a small circle of people you trust. A Pod owner invites people and can remove them. Pod members can see the details described in our Privacy Policy, such as who in the Pod can donate right now.",
    ],
    bullets: [
      "Only invite people who would want to be in your Pod.",
      "A Pod holds up to 20 people, and the number of Pods one person can own depends on their plan.",
      "Pod alerts work the same way on every plan.",
      "A Pod owner can run a practice drill: a clearly marked alert to their own Pod to check it would answer. A drill is never a real emergency, and answering one is optional.",
    ],
  },
  {
    title: "Discover",
    body: [
      "Discover lets signed-in people who choose to appear find donors by blood type and area. It shows blood type and an approximate area and distance only, never a name, photo or exact location. You can switch yourself off at any time.",
      "You must not use Discover to try to identify, track, contact or harass anyone.",
    ],
  },
  {
    title: "Laboratories and the Services page",
    body: [
      "Laboratories listed on BloodPod are independent businesses. We do not perform tests, and we do not control the tests, results, prices or opening times a laboratory offers. A listing is not an endorsement.",
      "When you ask a laboratory for a test, you agree that we share your name and phone number with that laboratory so it can reply. We share them only after you tick the consent box on the request.",
      "BloodPod may earn a commission from a laboratory when a booking made through BloodPod is completed. That does not cost you anything extra.",
    ],
  },
  {
    title: "The Care plan, payments and refunds",
    body: [
      "Some features are free. The paid Care plan is billed monthly in Ghana cedis and renews automatically until you cancel. The price is shown before you pay. Payments are handled by Paystack, and BloodPod never sees or stores your card or mobile money details.",
    ],
    bullets: [
      "You can cancel at any time from the Care plan page. After you cancel, you keep access until the end of the month you already paid for, and we do not charge you again.",
      "We do not give refunds for a month that has already started, except where the law requires it or where we charged you by mistake. If we did, write to us and we will put it right.",
      "A paid plan never changes who is alerted, in what order, or whether you can join a Pod or send an alert.",
      "Some Care plan tools are still being built. We will say clearly which ones are available.",
      "We may change prices or plans. We will tell you before a change reaches your next payment, and you can cancel before it does.",
    ],
  },
  {
    title: "Using BloodPod properly",
    body: ["You agree not to:"],
    bullets: [
      "send false or misleading emergency alerts, or alerts you do not need;",
      "pretend to be another person, a hospital or a laboratory;",
      "collect other people's information, or scrape or copy the service;",
      "try to break, overload or get around the security of BloodPod;",
      "use BloodPod for anything unlawful, or to hurt or frighten anyone.",
    ],
  },
  {
    title: "Alerts and notifications",
    body: [
      "We try to deliver alerts and reminders quickly, but phones, networks and browsers can delay or block them. We cannot promise that every notification arrives, or that anyone will respond.",
    ],
  },
  {
    title: "Our responsibility, and its limits",
    body: [
      "We work hard to keep BloodPod accurate and available, but we provide it \"as is\". We cannot guarantee that it will always work, be free of errors, or find a donor, a match or a laboratory slot when you need one.",
      "To the fullest extent the law allows, BloodPod is not responsible for what people do or fail to do, for a donor who does not arrive, for a laboratory's tests or results, or for medical outcomes. Nothing in these terms limits any right you have under Ghanaian law that cannot be limited, including for death or injury caused by our negligence.",
    ],
  },
  {
    title: "Your content and your data",
    body: [
      "You keep ownership of the information you add. You give us permission to use it only to run BloodPod for you, as explained in our Privacy Policy.",
      "You can ask us to delete your account and personal data at any time by writing to us. We may keep limited records where the law requires it, such as payment records.",
    ],
  },
  {
    title: "Suspending accounts",
    body: [
      "We may suspend or close an account that breaks these terms, puts others at risk, or is used to misuse alerts or other people's information. You can stop using BloodPod and ask us to close your account at any time.",
    ],
  },
  {
    title: "Changes to these terms",
    body: [
      "We may update these terms as BloodPod grows. When we make an important change, we will tell you in the app or by email. If you keep using BloodPod after a change, you accept the new terms.",
    ],
  },
  {
    title: "Law and getting in touch",
    body: [
      `These terms are governed by the laws of Ghana, and the courts of Ghana can settle any dispute. If something goes wrong, please write to ${CONTACT_EMAIL} first. We would like the chance to put it right.`,
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      current="terms"
      title="Terms of Use"
      intro="These are the rules for using BloodPod. We have written them in plain language so you can see what to expect from us and what we expect from you. By creating an account or using BloodPod, you agree to them."
      sections={SECTIONS}
    />
  );
}
