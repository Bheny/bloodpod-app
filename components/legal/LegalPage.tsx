import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { CONTACT_EMAIL, LEGAL_UPDATED } from "@/lib/legal";

export interface LegalSection {
  title: string;
  /** Paragraphs, each a string. */
  body?: string[];
  /** A bulleted list shown after the paragraphs. */
  bullets?: string[];
}

/** Shared shell for the Terms and Privacy pages. Public, so no sign-in needed. */
export function LegalPage({
  title,
  intro,
  sections,
  current,
}: {
  title: string;
  intro: string;
  sections: LegalSection[];
  current: "terms" | "privacy";
}) {
  return (
    <div className="force-light min-h-dvh bg-card">
      <header className="border-b-[0.5px] border-hairline px-5 py-4 lg:px-12">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" aria-label="BloodPod home">
            <Logo />
          </Link>
          <nav className="flex items-center gap-5 text-sm">
            <Link
              href="/terms"
              className={current === "terms" ? "font-bold text-ink" : "text-ink-muted hover:text-red-fg"}
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className={current === "privacy" ? "font-bold text-ink" : "text-ink-muted hover:text-red-fg"}
            >
              Privacy
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-16 pt-10 lg:pt-14">
        <h1 className="text-[30px] font-extrabold leading-tight tracking-[-1px] text-ink lg:text-[38px]">{title}</h1>
        <p className="mt-2 text-sm text-ink-muted">Last updated {LEGAL_UPDATED}</p>
        <p className="mt-6 text-base leading-relaxed text-ink-mid">{intro}</p>

        <nav aria-label="On this page" className="mt-8 rounded-2xl bg-surface p-5">
          <p className="text-label font-bold uppercase tracking-wide text-ink-muted">In this page</p>
          <ol className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
            {sections.map((s, i) => (
              <li key={s.title}>
                <a href={`#s${i + 1}`} className="text-ink-mid hover:text-red-fg">
                  {i + 1}. {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 flex flex-col gap-9">
          {sections.map((s, i) => (
            <section key={s.title} id={`s${i + 1}`} className="scroll-mt-6">
              <h2 className="text-title font-extrabold tracking-[-0.4px] text-ink lg:text-title-lg">
                {i + 1}. {s.title}
              </h2>
              {s.body?.map((p) => (
                <p key={p} className="mt-3 text-base leading-relaxed text-ink-mid">
                  {p}
                </p>
              ))}
              {s.bullets && (
                <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-base leading-relaxed text-ink-mid marker:text-ink-faint">
                  {s.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <p className="mt-12 rounded-2xl bg-surface p-5 text-sm leading-relaxed text-ink-mid">
          Questions about this page? Write to us at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-bold text-red-fg">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </main>
    </div>
  );
}
