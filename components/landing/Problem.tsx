import { Check, Clock, HelpCircle } from "lucide-react";
import { Reveal } from "@/components/landing/Reveal";
import { cn } from "@/lib/utils";

const CHAT = [
  { who: "Family group", text: "URGENT: anyone O negative??", time: "2:14 pm", side: "left" },
  { who: "Family group", text: "Which hospital?", time: "2:31 pm", side: "left" },
  { who: "Family group", text: "I think I'm A positive, does that work?", time: "3:02 pm", side: "left" },
  { who: "You", text: "Please, who can come today?", time: "3:40 pm", side: "right" },
] as const;

const ROSTER = [
  { name: "Ama", type: "O−", state: "yes", note: "On the way" },
  { name: "Kofi", type: "O−", state: "yes", note: "Said Yes" },
  { name: "Esi", type: "O−", state: "waiting", note: "Alert sent" },
  { name: "Yaw", type: "A+", state: "skip", note: "Not a match, not alerted" },
] as const;

export function Problem() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-[1100px]">
        <div className="mx-auto max-w-[720px] text-center">
          <Reveal>
            <p className="text-[11px] font-bold uppercase tracking-[2.5px] text-red">
              The problem
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="mt-4 text-[30px] font-extrabold leading-[1.15] tracking-[-1px] text-ink sm:text-[36px] sm:tracking-[-1.5px] lg:text-[48px]">
              The blood exists.
              <br />
              Finding it takes too long.
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-6 text-lg leading-[1.7] text-ink-mid">
              Today, a family in need starts a group chat and waits. BloodPod
              replaces that with a Pod that already knows who matches.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {/* Before */}
          <Reveal>
            <div className="h-full rounded-card border-[0.5px] border-[#E5E5EA] bg-white p-6">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-surface px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-ink-muted">
                  Without BloodPod
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
                  <Clock className="size-3.5" /> Still waiting
                </span>
              </div>

              <div className="mt-5 space-y-3 rounded-2xl bg-surface p-4">
                {CHAT.map((c) => (
                  <div
                    key={c.text}
                    className={cn("flex flex-col", c.side === "right" ? "items-end" : "items-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-snug",
                        c.side === "right"
                          ? "rounded-br-md bg-ink text-white"
                          : "rounded-bl-md bg-white text-ink shadow-raised",
                      )}
                    >
                      {c.side === "left" && (
                        <p className="mb-0.5 text-[10px] font-bold text-ink-muted">{c.who}</p>
                      )}
                      {c.text}
                    </div>
                    <span className="mt-1 text-[10px] text-ink-muted">{c.time}</span>
                  </div>
                ))}
              </div>

              <ul className="mt-5 space-y-2 text-sm text-ink-mid">
                <li className="flex items-start gap-2.5">
                  <HelpCircle className="mt-0.5 size-4 shrink-0 text-ink-muted" />
                  Nobody knows who has the right blood type
                </li>
                <li className="flex items-start gap-2.5">
                  <HelpCircle className="mt-0.5 size-4 shrink-0 text-ink-muted" />
                  Nobody knows who is eligible to give
                </li>
                <li className="flex items-start gap-2.5">
                  <HelpCircle className="mt-0.5 size-4 shrink-0 text-ink-muted" />
                  Replies trickle in over hours
                </li>
              </ul>
            </div>
          </Reveal>

          {/* After */}
          <Reveal delay={0.15}>
            <div className="h-full rounded-card border-[1.5px] border-red-mid bg-red-light/40 p-6">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-red px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                  With BloodPod
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-red">
                  <span className="size-1.5 animate-pulse-dot rounded-full bg-red" /> Live
                </span>
              </div>

              <div className="mt-5 rounded-2xl bg-white p-4 shadow-raised">
                <div className="flex items-center gap-3 border-b-[0.5px] border-hairline pb-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-red text-sm font-extrabold text-white">
                    O−
                  </span>
                  <div>
                    <p className="text-sm font-extrabold text-ink">Example Hospital</p>
                    <p className="text-xs text-ink-muted">Within 2 hours</p>
                  </div>
                </div>

                <ul className="mt-3 divide-y-[0.5px] divide-hairline">
                  {ROSTER.map((r) => (
                    <li key={r.name} className="flex items-center gap-3 py-2.5">
                      <span
                        className={cn(
                          "flex size-8 items-center justify-center rounded-full text-[11px] font-bold",
                          r.state === "skip" ? "bg-surface text-ink-muted" : "bg-red-light text-red",
                        )}
                      >
                        {r.type}
                      </span>
                      <span className={cn("flex-1 text-sm font-semibold", r.state === "skip" ? "text-ink-muted" : "text-ink")}>
                        {r.name}
                      </span>
                      {r.state === "yes" && <Check className="size-4 text-[#34C759]" />}
                      <span className="text-xs text-ink-muted">{r.note}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <ul className="mt-5 space-y-2 text-sm text-ink-mid">
                <li className="flex items-start gap-2.5">
                  <Check className="mt-0.5 size-4 shrink-0 text-red" />
                  Only matching, eligible donors are alerted
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="mt-0.5 size-4 shrink-0 text-red" />
                  Everyone answers Yes or No from one alert
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="mt-0.5 size-4 shrink-0 text-red" />
                  You see who is coming, as it happens
                </li>
              </ul>
            </div>
          </Reveal>
        </div>

        <p className="mt-6 text-center text-xs text-ink-muted">
          Illustration with made-up names and times.
        </p>
      </div>
    </section>
  );
}
