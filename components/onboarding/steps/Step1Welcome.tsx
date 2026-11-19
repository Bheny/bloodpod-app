"use client";

import { m } from "framer-motion";
import { Bell, ShieldCheck, Users } from "lucide-react";
import { LogoMark } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";

const BENEFITS = [
  {
    icon: Bell,
    title: "Hear first when blood is needed",
    body: "If your type is needed near you, you get an alert on your phone.",
  },
  {
    icon: Users,
    title: "Bring the people you trust",
    body: "Your church, office, school or family in one Pod, ready to answer together.",
  },
  {
    icon: ShieldCheck,
    title: "Stay in control",
    body: "Say No any time. Your number is shared only when you say Yes.",
  },
];

export function Step1Welcome({ name, onNext }: { name: string | null; onNext: () => void }) {
  const first = name?.split(" ")[0];
  return (
    <div className="flex flex-1 flex-col px-6 py-10">
      <div className="flex-1">
        <m.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
          <LogoMark className="size-11" />
        </m.div>

        <m.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="mt-5 text-[26px] font-extrabold leading-[1.15] tracking-[-0.8px] text-ink"
        >
          {first ? `Welcome, ${first}.` : "Welcome."}
          <br />
          Let&apos;s get you ready.
        </m.h1>
        <m.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mt-2 text-sm text-ink-muted"
        >
          Six quick steps, about two minutes.
        </m.p>

        <ul className="mt-7 space-y-3">
          {BENEFITS.map((b, i) => (
            <m.li
              key={b.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.12 }}
              className="flex gap-3 rounded-card border-[0.5px] border-hairline bg-card p-4"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-red-light">
                <b.icon className="size-[18px] text-red-fg" />
              </span>
              <span>
                <span className="block text-sm font-bold text-ink">{b.title}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-ink-muted">{b.body}</span>
              </span>
            </m.li>
          ))}
        </ul>
      </div>

      <Button onClick={onNext} size="lg" className="mt-8 w-full">
        Let&apos;s start
      </Button>
    </div>
  );
}
