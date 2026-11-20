import { appUrl } from "@/lib/email/send";
import { hi, queue } from "@/lib/email/notify";

// Captain programme emails. Short and warm; nothing here promises money or perks.

export function emailCaptainApproved(p: { to: string; userId: string; name: string | null; title: string; level: number }) {
  queue(
    p.to,
    {
      subject: `You are now a ${p.title} on BloodPod`,
      preheader: "Thank you for building a stronger network.",
      heading: `You are a ${p.title}`,
      paragraphs: [
        hi(p.name),
        `People you brought in started Pods of their own, and your Pod showed it can answer fast. That is why you are now a ${p.title}.`,
        "Take a moment to read and accept our pledge, and your badge will show on your Pod and profile.",
      ],
      cta: { label: "Open your Captain page", url: appUrl("/captain") },
    },
    `captain-approved/${p.userId}/${p.level}`,
  );
}

export function emailCaptainLapseWarning(p: { to: string; userId: string; name: string | null; title: string; daysLeft: number; stamp: string }) {
  queue(
    p.to,
    {
      subject: `${p.daysLeft} days to keep your ${p.title} badge`,
      preheader: "A drill or a new Pod is all it takes.",
      heading: "Your Pods need a little attention",
      paragraphs: [
        hi(p.name),
        `Your Pod no longer meets everything a ${p.title} needs, but you keep your badge for ${p.daysLeft} more days while you put it right.`,
        "Usually it is a quick drill, or a Pod that has gone quiet. Your Captain page shows exactly what is missing.",
      ],
      cta: { label: "See what is missing", url: appUrl("/captain") },
    },
    `captain-warning/${p.userId}/${p.stamp}`,
  );
}

export function emailCaptainLapsed(p: { to: string; userId: string; name: string | null; title: string; stamp: string }) {
  queue(
    p.to,
    {
      subject: `Your ${p.title} badge is paused`,
      preheader: "You can get it back any time.",
      heading: "Your badge is paused",
      paragraphs: [
        hi(p.name),
        `The requirements for ${p.title} have not been met for 60 days, so your badge is paused. Your Pod and everyone in it are exactly as they were.`,
        "Meet them again and it comes back.",
      ],
      cta: { label: "See what is needed", url: appUrl("/captain") },
    },
    `captain-lapsed/${p.userId}/${p.stamp}`,
  );
}
