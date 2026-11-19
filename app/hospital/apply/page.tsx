import type { Metadata } from "next";
import Link from "next/link";
import { BellRing, ClipboardCheck, Radar, ShieldCheck, Timer } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { HospitalApplyForm } from "@/components/hospital/HospitalApplyForm";

export const metadata: Metadata = {
  title: "Apply for hospital access | BloodPod",
  description: "Apply to join the BloodPod pilot and find matching donors in minutes.",
};

const GAINS = [
  { icon: Radar, title: "See who is nearby", body: "Eligible donors by blood type around your facility, with no names until a donor says Yes." },
  { icon: BellRing, title: "Alert in one step", body: "Choose the blood type you need and matching donors get an alert on their phone." },
  { icon: Timer, title: "Track the response", body: "Watch who says Yes and who is on the way, with a timer from the moment you send." },
];

const STEPS = [
  "You apply, in about two minutes",
  "We call you to verify your facility",
  "We run a practice drill together",
];

export default function HospitalApplyPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="relative overflow-hidden bg-panel px-6 py-10 text-white sm:px-10 lg:px-14 lg:py-14">
        <Link href="/" className="inline-flex">
          <Logo variant="light" />
        </Link>

        <p className="mt-12 text-[11px] font-bold uppercase tracking-[2.5px] text-red-fg">For hospitals and blood banks</p>
        <h1 className="mt-4 max-w-[460px] text-[32px] font-extrabold leading-[1.1] tracking-[-1px] lg:text-[42px]">
          Find matching donors in minutes, not hours.
        </h1>
        <p className="mt-4 max-w-[440px] text-base leading-[1.7] text-white/60">
          BloodPod is piloting with a small number of facilities. Apply and we will set up a practice drill with you
          before any real emergency.
        </p>

        <ul className="mt-10 space-y-5">
          {GAINS.map((g) => (
            <li key={g.title} className="flex gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <g.icon className="size-5 text-red-fg" />
              </span>
              <span>
                <span className="block text-sm font-bold">{g.title}</span>
                <span className="mt-0.5 block text-sm leading-relaxed text-white/55">{g.body}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-12 rounded-card border border-white/10 bg-white/5 p-5">
          <p className="flex items-center gap-2 text-sm font-bold">
            <ClipboardCheck className="size-4 text-red-fg" /> What happens next
          </p>
          <ol className="mt-3 space-y-2 text-sm text-white/65">
            {STEPS.map((s, i) => (
              <li key={s} className="flex gap-3">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </div>

        <p className="mt-8 flex items-start gap-2 text-xs leading-relaxed text-white/45">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" />
          Donor privacy comes first. You only ever see anonymised counts until a donor chooses to respond.
        </p>
      </aside>

      <main className="flex items-center justify-center bg-surface px-4 py-10 sm:px-8">
        <div className="w-full max-w-[520px] rounded-modal border-[0.5px] border-hairline bg-card p-6 sm:p-10">
          <HospitalApplyForm />
        </div>
      </main>
    </div>
  );
}
