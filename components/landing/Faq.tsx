"use client";

import { useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { Plus } from "lucide-react";
import { Reveal } from "@/components/landing/Reveal";
import { cn } from "@/lib/utils";

const ITEMS = [
  {
    q: "Is BloodPod free?",
    a: "Yes for donors. We will never charge a donor to be listed, never charge a patient to find blood, and never pay cash for a donation.",
  },
  {
    q: "Who can see my details?",
    a: "Pod members can see each other. A hospital or family member only sees your name and phone number after you say Yes to an alert. If you say No, nothing private is shared.",
  },
  {
    q: "Do I have to answer every alert?",
    a: "No. You can say No, and you get at most 3 non-critical alerts a day. If you are in several Pods, you receive one notification per emergency, not one per Pod.",
  },
  {
    q: "What if I donated recently?",
    a: "Add your last donation date and BloodPod will not alert you until you are eligible again, which is after 3 months.",
  },
  {
    q: "Does the verified badge mean my blood is safe?",
    a: "No. The badge shows that a reviewer checked your lab report against your profile. The hospital still types and crossmatches blood at the point of donation.",
  },
  {
    q: "Do I need to download an app?",
    a: "No. BloodPod opens from a link. Add it to your home screen to get emergency alerts. On iPhone, alerts only work once it has been added to the Home Screen.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="px-6 py-24">
      <div className="mx-auto max-w-[760px]">
        <Reveal className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[2.5px] text-red">Questions</p>
          <h2 className="mt-4 text-[32px] font-extrabold tracking-[-1px] text-ink lg:text-[40px]">
            Trust is the whole point.
          </h2>
        </Reveal>

        <div className="mt-12 divide-y-[0.5px] divide-hairline rounded-card border-[0.5px] border-[#E5E5EA] bg-white">
          {ITEMS.map((item, i) => {
            const on = open === i;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  aria-expanded={on}
                  onClick={() => setOpen(on ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="text-base font-bold text-ink">{item.q}</span>
                  <Plus className={cn("size-5 shrink-0 text-red transition-transform duration-200", on && "rotate-45")} />
                </button>
                <AnimatePresence initial={false}>
                  {on && (
                    <m.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-5 text-sm leading-[1.7] text-ink-mid">{item.a}</p>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
