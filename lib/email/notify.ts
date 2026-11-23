import { appUrl, deferEmail, sendEmail } from "@/lib/email/send";
import { render, type EmailContent } from "@/lib/email/layout";
import { formatDate } from "@/lib/formatters";
import { formatPesewas } from "@/lib/pricing";

/**
 * Every email BloodPod sends, one function each. Callers hand over plain values and never wait on
 * the result: each function schedules the send after the response (see deferEmail) and swallows
 * failures, so email can never break the flow it belongs to.
 */

function first(name: string | null | undefined) {
  return name?.trim().split(/\s+/)[0] || null;
}
export const hi = (name: string | null | undefined) => (first(name) ? `Hi ${first(name)},` : "Hi,");

export function queue(to: string | string[] | null | undefined, content: EmailContent, idempotencyKey?: string) {
  if (!to || (Array.isArray(to) && to.length === 0)) return;
  deferEmail(() => sendEmail({ to, ...render(content), idempotencyKey }));
}

/** Awaitable version, for the cron job that has to know what went out. */
export async function sendNow(to: string, content: EmailContent, idempotencyKey?: string) {
  return sendEmail({ to, ...render(content), idempotencyKey });
}

function adminAddresses(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

// ── Pods ────────────────────────────────────────────────────────────────────

export function emailPodInvite(p: {
  to: string;
  inviteId: string;
  inviterName: string | null;
  podName: string;
  token: string;
  expiresAt: Date;
  /** A resend of the same invite is a new email, so it gets its own key. */
  resendStamp?: string;
}) {
  const who = p.inviterName ?? "Someone you know";
  queue(
    p.to,
    {
      subject: `${who} invited you to join ${p.podName} on BloodPod`,
      preheader: "A Pod is a few people who agree to show up for each other when blood is needed.",
      heading: `Join ${p.podName}`,
      paragraphs: [
        `${who} invited you to their Pod on BloodPod. A Pod is a small circle of people you trust who can be called on when someone needs blood fast.`,
        "You only hear about matches near you, and your name and number are shared only if you say Yes to a request.",
      ],
      cta: { label: "See the invitation", url: appUrl(`/invite/${p.token}`) },
      footnote: `This invitation expires on ${formatDate(p.expiresAt)}. If you do not know ${who}, you can ignore this email.`,
    },
    `pod-invite/${p.inviteId}${p.resendStamp ? `/${p.resendStamp}` : ""}`,
  );
}

export function emailMemberJoined(p: {
  to: string;
  ownerName: string | null;
  memberName: string | null;
  podName: string;
  memberCount: number;
  podId: string;
  joinKey: string;
}) {
  const who = p.memberName ?? "Someone";
  queue(
    p.to,
    {
      subject: `${who} joined ${p.podName}`,
      preheader: `${p.memberCount} ${p.memberCount === 1 ? "person is" : "people are"} in your Pod now.`,
      heading: `${who} joined your Pod`,
      paragraphs: [
        hi(p.ownerName),
        `${who} accepted your invitation. There are now ${p.memberCount} people in ${p.podName}.`,
        "The more people you have, the better your chances of finding a match fast.",
      ],
      cta: { label: "Open your Pod", url: appUrl(`/pod/${p.podId}`) },
    },
    `member-joined/${p.joinKey}`,
  );
}

// ── Account ─────────────────────────────────────────────────────────────────

export function emailWelcome(p: { to: string; userId: string; name: string | null; bloodType: string | null }) {
  queue(
    p.to,
    {
      subject: "Welcome to BloodPod",
      preheader: "Your next step: invite the people you would call in an emergency.",
      heading: first(p.name) ? `Welcome, ${first(p.name)}` : "Welcome to BloodPod",
      paragraphs: [
        p.bloodType
          ? `You are set up as ${p.bloodType}. When someone near you needs your blood type, you will hear about it first.`
          : "You are set up. Add your blood group whenever you know it, so we can tell you when it is needed.",
        "The strongest thing you can do now is build your Pod: invite three people you trust, so help is already in place before anyone needs it.",
      ],
      cta: { label: "Build your Pod", url: appUrl("/pod/invite") },
      footnote: "You only hear about matches near you. You can pause alerts any time from your home screen.",
    },
    `welcome/${p.userId}`,
  );
}

// ── Emergencies ─────────────────────────────────────────────────────────────

export function emailEmergencyAlert(p: {
  to: string;
  requestId: string;
  name: string | null;
  bloodType: string;
  urgency: "CRITICAL" | "URGENT" | "STANDARD";
  facility: string;
  location: string | null;
}) {
  const label = p.urgency === "CRITICAL" ? "Critical" : p.urgency === "URGENT" ? "Urgent" : "Needed";
  queue(
    p.to,
    {
      subject: `${label}: ${p.bloodType} blood needed at ${p.facility}`,
      preheader: "Someone near you needs your blood type. Tap to answer.",
      heading: `${p.bloodType} needed at ${p.facility}`,
      urgent: true,
      paragraphs: [
        hi(p.name),
        "Someone near you needs your blood type. Open BloodPod to say whether you can help.",
        "Your name and number are shared only if you answer Yes. Say No and nothing is shared.",
      ],
      facts: [
        { label: "Urgency", value: label },
        { label: "Blood type", value: p.bloodType },
        { label: "Where", value: [p.facility, p.location].filter(Boolean).join(", ") },
      ],
      cta: { label: "Yes, I can help", url: appUrl(`/dashboard/alert/${p.requestId}`) },
    },
    `emergency-alert/${p.requestId}/${p.to}`,
  );
}

export function emailEmergencyUpdate(p: {
  to: string;
  requestId: string;
  name: string | null;
  bloodType: string;
  facility: string;
  outcome: "FULFILLED" | "CANCELLED";
}) {
  const done = p.outcome === "FULFILLED";
  queue(
    p.to,
    {
      subject: done ? `Thank you: the ${p.bloodType} request at ${p.facility} is covered` : `Update: the ${p.bloodType} request at ${p.facility} was closed`,
      preheader: done ? "The need has been met." : "You no longer need to do anything.",
      heading: done ? "The request has been met" : "The request was closed",
      paragraphs: [
        hi(p.name),
        done
          ? `The request for ${p.bloodType} blood at ${p.facility} has been fulfilled. Thank you for being ready to help.`
          : `The request for ${p.bloodType} blood at ${p.facility} was cancelled. You do not need to do anything.`,
      ],
      cta: { label: "Open BloodPod", url: appUrl("/dashboard") },
    },
    `emergency-update/${p.requestId}/${p.outcome}/${p.to}`,
  );
}

// ── Donations ───────────────────────────────────────────────────────────────

export function emailDonationRecorded(p: {
  to: string;
  donationId: string;
  name: string | null;
  facility: string;
  donatedAt: Date;
  count: number;
  nextEligible: Date;
}) {
  queue(
    p.to,
    {
      subject: "Your donation is recorded",
      preheader: `Thank you. You can give again from ${formatDate(p.nextEligible)}.`,
      heading: "Thank you for giving blood",
      paragraphs: [hi(p.name), "Your donation has been added to your Blood Passport. You rest for 3 months, and we will not alert you until you are eligible again."],
      facts: [
        { label: "Where", value: p.facility },
        { label: "Date", value: formatDate(p.donatedAt) },
        { label: "Donations so far", value: String(p.count) },
        { label: "Eligible again", value: formatDate(p.nextEligible) },
      ],
      cta: { label: "View your passport", url: appUrl("/passport") },
    },
    `donation/${p.donationId}`,
  );
}

export function eligibleAgainContent(p: { name: string | null }): EmailContent {
  return {
    subject: "You can donate blood again",
    preheader: "Your 3 months of rest are over.",
    heading: "You are eligible again",
    paragraphs: [
      hi(p.name),
      "It has been 3 months since your last donation, so you can give again. If you are well, even one donation can matter to someone.",
      "Turn your alerts back on if you paused them, and we will tell you when your blood type is needed near you.",
    ],
    cta: { label: "Open BloodPod", url: appUrl("/dashboard") },
  };
}

// ── Lab bookings ────────────────────────────────────────────────────────────

type BookingFacts = { labName: string; testName: string; when: Date | null };

const bookingFacts = (b: BookingFacts) => [
  { label: "Lab", value: b.labName },
  { label: "Test", value: b.testName },
  ...(b.when ? [{ label: "Day", value: formatDate(b.when) }] : []),
];

export function emailBookingRequested(p: { to: string; bookingId: string; name: string | null } & BookingFacts) {
  queue(
    p.to,
    {
      subject: `Request sent to ${p.labName}`,
      preheader: "The lab will confirm or suggest another day.",
      heading: "Your request is with the lab",
      paragraphs: [hi(p.name), "We sent your request. The lab will confirm it or suggest another day, and we will email you either way."],
      facts: bookingFacts(p),
      cta: { label: "See my bookings", url: appUrl("/services/bookings") },
    },
    `booking-requested/${p.bookingId}`,
  );
}

export function emailBookingUpdate(
  p: { to: string; bookingId: string; name: string | null; status: "CONFIRMED" | "RESCHEDULED" | "DECLINED" | "CANCELLED" | "COMPLETED"; labNote: string | null } & BookingFacts,
) {
  const copy = {
    CONFIRMED: { subject: `${p.labName} confirmed your visit`, heading: "Your visit is confirmed", line: "The lab confirmed your visit. Please arrive on the day with a valid ID." },
    RESCHEDULED: { subject: `${p.labName} suggested another day`, heading: "The lab suggested another day", line: "The lab cannot do your first choice and suggested another day. Open your bookings to accept it or cancel." },
    DECLINED: { subject: `${p.labName} cannot do this request`, heading: "The lab cannot do this one", line: "The lab was not able to take this request. You can book another lab from Services." },
    CANCELLED: { subject: `Your visit to ${p.labName} was cancelled`, heading: "Your visit was cancelled", line: "This visit was cancelled. You can book another time from Services." },
    COMPLETED: { subject: "Your lab visit is complete", heading: "Your visit is complete", line: "The lab marked your visit as complete. Any results come from the lab itself. Add them to your Blood Passport so they are with you when you need them." },
  }[p.status];

  queue(
    p.to,
    {
      subject: copy.subject,
      preheader: copy.line,
      heading: copy.heading,
      paragraphs: [hi(p.name), copy.line, ...(p.labNote ? [`Note from the lab: ${p.labNote}`] : [])],
      facts: bookingFacts(p),
      cta: { label: p.status === "COMPLETED" ? "Open my passport" : "See my bookings", url: appUrl(p.status === "COMPLETED" ? "/passport" : "/services/bookings") },
    },
    `booking-${p.status.toLowerCase()}/${p.bookingId}`,
  );
}

export function bookingReminderContent(p: { name: string | null } & BookingFacts): EmailContent {
  return {
    subject: `Tomorrow: your visit to ${p.labName}`,
    preheader: "A reminder for tomorrow.",
    heading: "Your lab visit is tomorrow",
    paragraphs: [hi(p.name), "A quick reminder about your visit tomorrow. Please bring a valid ID."],
    facts: bookingFacts(p),
    cta: { label: "See my bookings", url: appUrl("/services/bookings") },
  };
}

/** Tells the lab's staff a person asked for a test. Sent to their account emails. */
export function emailLabNewRequest(p: { to: string[]; bookingId: string; personName: string | null; labName: string; testName: string; preferred: Date | null }) {
  queue(
    p.to,
    {
      subject: `New test request at ${p.labName}`,
      preheader: `${p.personName ?? "Someone"} wants ${p.testName}.`,
      heading: "New test request",
      paragraphs: ["A person asked for a test at your lab. Open your inbox to confirm it or suggest another day."],
      facts: [
        { label: "Person", value: p.personName ?? "A BloodPod member" },
        { label: "Test", value: p.testName },
        ...(p.preferred ? [{ label: "Preferred day", value: formatDate(p.preferred) }] : []),
      ],
      cta: { label: "Open lab inbox", url: appUrl("/lab") },
    },
    `lab-request/${p.bookingId}`,
  );
}

// ── Hospitals and labs ──────────────────────────────────────────────────────

export function emailHospitalReceived(p: { to: string; hospitalId: string; name: string | null; hospitalName: string }) {
  queue(
    p.to,
    {
      subject: "We received your application",
      preheader: `${p.hospitalName} is in review.`,
      heading: "Application received",
      paragraphs: [hi(p.name), `Thank you for applying for ${p.hospitalName}. We check each facility before it can send requests, and we will email you as soon as we have decided.`],
    },
    `hospital-received/${p.hospitalId}`,
  );
}

export function emailHospitalDecision(p: {
  to: string;
  hospitalId: string;
  name: string | null;
  hospitalName: string;
  status: "APPROVED" | "REJECTED";
  note: string | null;
  stamp: string;
}) {
  const ok = p.status === "APPROVED";
  queue(
    p.to,
    {
      subject: ok ? `${p.hospitalName} is approved on BloodPod` : `Update on your BloodPod application`,
      preheader: ok ? "You can now use the hospital portal." : "We could not approve it this time.",
      heading: ok ? "You are approved" : "We could not approve this yet",
      paragraphs: [
        hi(p.name),
        ok ? `${p.hospitalName} is approved. You can now use your hospital portal.` : `We could not approve ${p.hospitalName} at this time.`,
        ...(p.note && !ok ? [`Reason: ${p.note}`] : []),
        ...(!ok ? ["If something is missing or wrong, reply to this email and we will look again."] : []),
      ],
      cta: ok ? { label: "Open the hospital portal", url: appUrl("/hospital") } : undefined,
    },
    `hospital-decision/${p.hospitalId}/${p.status}/${p.stamp}`,
  );
}

export function emailLabStaffAdded(p: { to: string; userId: string; name: string | null; labName: string }) {
  queue(
    p.to,
    {
      subject: `You now have access to ${p.labName} on BloodPod`,
      preheader: "Sign in to see test requests.",
      heading: `Welcome to ${p.labName}`,
      paragraphs: [hi(p.name), `You were given access to the ${p.labName} inbox on BloodPod. Sign in to see test requests and answer them.`],
      cta: { label: "Open lab inbox", url: appUrl("/lab") },
    },
    `lab-staff/${p.userId}/${p.labName}`,
  );
}

// ── Plans and payments ──────────────────────────────────────────────────────

export function emailPlanInterest(p: { to: string; userId: string; name: string | null; planName: string }) {
  queue(
    p.to,
    {
      subject: `We will tell you when ${p.planName} opens`,
      preheader: "You are on the list.",
      heading: "You are on the list",
      paragraphs: [hi(p.name), `Thanks for your interest in ${p.planName}. We will email you the moment it opens. Nothing is charged until then.`],
    },
    `plan-interest/${p.userId}/${p.planName}`,
  );
}

export function emailPaymentReceipt(p: {
  to: string;
  reference: string;
  name: string | null;
  amountPesewas: number;
  planName: string;
  periodEnd: Date | null;
}) {
  queue(
    p.to,
    {
      subject: `Receipt: ${formatPesewas(p.amountPesewas)} for ${p.planName}`,
      preheader: "Thank you. Your payment went through.",
      heading: "Payment received",
      paragraphs: [hi(p.name), `Thank you. We received your payment for ${p.planName}.`],
      facts: [
        { label: "Amount", value: formatPesewas(p.amountPesewas) },
        { label: "Plan", value: p.planName },
        ...(p.periodEnd ? [{ label: "Active until", value: formatDate(p.periodEnd) }] : []),
        { label: "Reference", value: p.reference },
      ],
      cta: { label: "Manage my plan", url: appUrl("/profile") },
    },
    `receipt/${p.reference}`,
  );
}

// ── Asking a donor for help ─────────────────────────────────────────────────

export function emailDonorRequestReceived(p: {
  to: string;
  requestId: string;
  donorName: string | null;
  seekerFirstName: string;
  message: string | null;
}) {
  queue(
    p.to,
    {
      subject: `${p.seekerFirstName} is asking for your help`,
      preheader: "Nothing is shared unless you say yes.",
      heading: `${p.seekerFirstName} is asking for your help`,
      paragraphs: [
        hi(p.donorName),
        `${p.seekerFirstName} found you on BloodPod and would like your help.`,
        ...(p.message ? [`They wrote: "${p.message}"`] : []),
        "You decide. Your name and number are shared only if you say yes. Say no and nothing is shared.",
      ],
      cta: { label: "Answer the request", url: appUrl("/profile/notifications") },
      footnote: "If you do not answer, the request lapses by itself in 48 hours.",
    },
    `donor-request/${p.requestId}`,
  );
}

export function emailDonorRequestAccepted(p: { to: string; requestId: string; seekerName: string | null; donorFirstName: string }) {
  queue(
    p.to,
    {
      subject: `${p.donorFirstName} said yes`,
      preheader: "Open BloodPod to see how to reach them.",
      heading: `${p.donorFirstName} said yes`,
      paragraphs: [hi(p.seekerName), `${p.donorFirstName} agreed to help. Open BloodPod to see their details and get in touch.`],
      cta: { label: "See their details", url: appUrl("/discover/requests") },
      footnote: "Their phone number is only in the app, never in this email.",
    },
    `donor-request-accepted/${p.requestId}`,
  );
}

// ── For you, the admin ──────────────────────────────────────────────────────

export function emailAdmins(p: { key: string; subject: string; lines: string[]; cta?: { label: string; url: string } }) {
  const to = adminAddresses();
  queue(
    to,
    { subject: p.subject, preheader: p.lines[0] ?? p.subject, heading: p.subject, paragraphs: p.lines, cta: p.cta },
    `admin/${p.key}`,
  );
}
