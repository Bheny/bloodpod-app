"use client";

import { useState } from "react";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";

const LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "For hospitals", href: "#hospitals" },
  { label: "Pricing", href: "#pricing" },
];

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <m.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="sticky top-0 z-50 h-16 border-b-[0.5px] border-[#E5E5EA] bg-white/92 backdrop-blur-md"
    >
      <nav className="mx-auto flex h-full max-w-[1280px] items-center justify-between px-5 lg:px-12">
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative text-sm font-medium text-ink-mid transition-colors after:absolute after:-bottom-1 after:left-0 after:h-[1.5px] after:w-full after:origin-left after:scale-x-0 after:bg-red after:transition-transform after:duration-200 hover:text-ink hover:after:scale-x-100"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-4 lg:flex">
          <Link href="/sign-in" className="text-sm font-semibold text-ink-mid hover:text-ink">
            Sign in
          </Link>
          <Button asChild size="sm">
            <Link href="/sign-up">Build your pod →</Link>
          </Button>
        </div>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="-mr-2 flex size-10 items-center justify-center rounded-full text-ink lg:hidden"
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 top-16 z-40 flex flex-col gap-1 bg-white p-6 lg:hidden"
          >
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3.5 text-base font-semibold text-ink-mid hover:bg-surface"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-4 flex flex-col gap-3 px-4">
              <Link
                href="/sign-in"
                onClick={() => setOpen(false)}
                className="text-center text-base font-semibold text-ink-mid"
              >
                Sign in
              </Link>
              <Button asChild size="default">
                <Link href="/sign-up" onClick={() => setOpen(false)}>
                  Build your pod →
                </Link>
              </Button>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </m.header>
  );
}
