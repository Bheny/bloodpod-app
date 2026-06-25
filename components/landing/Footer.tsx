import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

const LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "For hospitals", href: "#hospitals" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

export function Footer() {
  return (
    <footer className="border-t-[0.5px] border-[#E5E5EA] px-6 py-10 lg:px-12">
      <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-8 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex flex-col items-center gap-1 sm:items-start">
          <Logo />
          <p className="text-sm text-ink-muted">Built in Ghana. For Ghana.</p>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-6">
          {LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm text-ink-muted transition-colors duration-150 hover:text-red"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <a
            href="mailto:hello@bloodpod.gh"
            className="text-sm text-ink-muted transition-colors duration-150 hover:text-red"
          >
            hello@bloodpod.gh
          </a>
        </div>
      </div>
    </footer>
  );
}
