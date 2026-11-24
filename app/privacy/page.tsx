import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/legal/LegalPage";
import { CONTACT_EMAIL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy | BloodPod",
  description: "What BloodPod collects, why, who sees it and the choices you have.",
};

const SECTIONS: LegalSection[] = [
  {
    title: "The short version",
    bullets: [
      "We collect only what BloodPod needs to work: who you are, how to reach you, your blood type and where you are, roughly.",
      "Health information is sensitive, so we treat it with extra care. You choose who sees it.",
      "We never sell your information.",
      "You can see, change and delete your information, and withdraw your consent, whenever you like.",
    ],
  },
  {
    title: "Who we are",
    body: [
      `BloodPod is the service that decides how your information is used, so we are the data controller. You can reach us at ${CONTACT_EMAIL}. We handle personal information in line with Ghana's Data Protection Act, 2012 (Act 843).`,
    ],
  },
  {
    title: "What we collect",
    body: ["Depending on what you use, we may hold:"],
    bullets: [
      "Account details: your name, email address, phone number and profile photo.",
      "Health and donor details: your blood type, whether you are eligible and available to donate, your donation history, and any medical history you choose to add.",
      "Location: your city, and, if you allow it, your approximate position so we can sort results by distance.",
      "Pod details: which Pods you own or belong to, and who is in them. If you lead a Pod, you can sort each person into a group, such as Family, Friends, School, Church, Work or Neighbours. We keep that group with the person's place in your Pod.",
      "Essentials: any ID cards or documents you choose to store.",
      "Care profiles: for families using the Care plan, details about the person needing blood, such as blood type, condition and hospital.",
      "Bookings: tests you ask laboratories for, the day you prefer, and any note you write.",
      "Payments: the plan, amount and reference of a payment. Paystack keeps your card or mobile money details. We never see them.",
      "Device details: a notification token if you turn on alerts, and basic technical logs, such as your device type and errors.",
      "How BloodPod is used: which pages are opened, on what kind of device, from roughly where, and how the visit began. See \"Counting visits\" below.",
    ],
  },
  {
    title: "Why we use it, and our basis for doing so",
    body: ["We use your information to:"],
    bullets: [
      "create and run your account;",
      "tell you and your Pod about emergencies, and help hospitals reach willing donors;",
      "show you donors, laboratories and results near you;",
      "arrange test bookings you ask for;",
      "take payments for the Care plan and keep payment records;",
      "keep BloodPod safe, fix problems and prevent misuse;",
      "tell you about important changes.",
    ],
  },
  {
    title: "Counting visits",
    body: [
      "To learn what works and what does not, BloodPod keeps its own simple count of visits. We do not use Google Analytics or any other third party for this, and nothing about it is shared or sold.",
    ],
    bullets: [
      "What we record: the page opened (never the web address after the question mark), a random number your browser makes up for itself, the kind of device, your country and city as the host works them out, and where the visit came from, such as a link or a search.",
      "What we do not record: your IP address, anything you type, or the names of private links such as invitations.",
      "If you are signed in, a page view is tied to your account so we can see how members use the app. When you are not, it is tied only to the random number.",
      "If your browser sends Do Not Track or Global Privacy Control, we do not count you at all.",
      "We keep page views for 13 months, then delete them.",
    ],
  },
  {
    title: "Consent for health information",
    body: [
      "Because health information is sensitive, we ask for your consent before we use it, and we record when you gave it. For example, we ask when you sign up, when you choose to appear in Discover, and before we share your name and phone number with a laboratory for a booking.",
      "You can withdraw your consent at any time, from your profile where there is a setting for it, or by writing to us. If you withdraw it, some features that need that information will stop working for you.",
    ],
  },
  {
    title: "Who can see what",
    bullets: [
      "Your Pod: members can see your first name, your blood type, and whether you can donate right now. They do not see more than that unless you share it.",
      "Groups in a Pod: a group such as Church or School can say something personal about a person, so only the Pod's owner and the person themselves can see it. Other members, laboratories, hospitals and other donors never see it. It is not shown in our reports or counts, on any leaderboard or poster, or in alerts, and we do not use it to decide who is alerted.",
      "Discover: people only see your blood type, an approximate area and a rough distance, and only if you choose to appear. We never show your name, photo, phone number or exact position there. We move positions onto a coarse grid before showing them.",
      "Laboratories: a laboratory sees your name and phone number only for a booking you asked for, after you ticked the consent box.",
      "Hospitals: partner hospitals see anonymous counts until a donor chooses to respond to a request.",
      "BloodPod staff: only the few people who run BloodPod, and only when they need to, for example to help you or fix a problem.",
    ],
  },
  {
    title: "Companies that help us run BloodPod",
    body: [
      "We use trusted companies to run the service. They handle information only on our instructions and only to provide their service:",
    ],
    bullets: [
      "Supabase, for sign-in and our database.",
      "Vercel, which hosts the app.",
      "Paystack, which processes Care plan payments.",
      "An email service, to send messages such as sign-up confirmations and invitations.",
      "Your browser or phone's push notification service, to deliver alerts.",
      "OpenStreetMap, which provides the map pictures. Loading a map shares your device's address with it.",
    ],
  },
  {
    title: "Where your information is kept",
    body: [
      "Our providers may store information on servers outside Ghana. We choose providers that protect information carefully, and we only share what is needed.",
    ],
  },
  {
    title: "How long we keep it",
    body: [
      "We keep your information while your account is open. If you delete your account, we delete or anonymise your personal information, except for records we must keep by law, such as payment records, and what is needed to deal with a dispute or misuse. Pending alerts and bookings may take a short time to clear.",
    ],
  },
  {
    title: "How we protect it",
    body: [
      "We use secure connections, sign-in protection and limits on who can reach information. No system is perfectly secure. If something goes wrong that puts your information at risk, we will tell you and the right authority as the law requires.",
    ],
  },
  {
    title: "Your rights",
    body: ["You can ask us to:"],
    bullets: [
      "show you the information we hold about you;",
      "correct anything that is wrong;",
      "delete your information;",
      "stop using it for a particular purpose, or withdraw your consent;",
      "give you a copy of it.",
    ],
  },
  {
    title: "Children",
    body: [
      "BloodPod is for people aged 18 and over. If you manage a Care profile for a child, you are their parent or legal guardian and you act for them. If you think a child has signed up on their own, please write to us.",
    ],
  },
  {
    title: "Changes to this policy",
    body: [
      "We may update this policy as BloodPod grows. When we make an important change, we will tell you in the app or by email.",
    ],
  },
  {
    title: "Contact us",
    body: [
      `For any question, request or complaint about your information, write to ${CONTACT_EMAIL}. You also have the right to complain to Ghana's Data Protection Commission.`,
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      current="privacy"
      title="Privacy Policy"
      intro="Your health and contact details are personal, and we take that seriously. This page explains what BloodPod collects, why, who can see it, and the choices you have."
      sections={SECTIONS}
    />
  );
}
