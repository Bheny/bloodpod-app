import Link from "next/link";
import { FlaskConical } from "lucide-react";

/**
 * Shown when someone doesn't know their blood type. Most people don't, so this is a normal way
 * through, not an error: it says what happens next and where to find out.
 */
export function BloodTypeHelp({ signedIn = false }: { signedIn?: boolean }) {
  return (
    <div className="rounded-card bg-surface p-4 text-sm leading-relaxed text-ink-mid" aria-live="polite">
      <p className="font-bold text-ink">That&apos;s very common. Most people find out when they first donate or get tested.</p>
      <p className="mt-2">
        You can still join. Requests are matched on blood type, so we won&apos;t send you any until you add it. Everything
        else works as normal.
      </p>
      <p className="mt-3 text-xs font-bold uppercase tracking-wide text-ink-muted">Where you might already have it</p>
      <ul className="mt-1.5 list-disc space-y-1 pl-5 text-[13px]">
        <li>A donor card from a past donation</li>
        <li>Antenatal, clinic or hospital records</li>
        <li>Past lab results, or a school or work medical</li>
      </ul>
      <p className="mt-3 text-[13px]">
        Can&apos;t find it? A quick lab test will tell you.
        {signedIn && (
          <>
            {" "}
            <Link href="/services" className="inline-flex items-center gap-1 font-semibold text-red-fg hover:underline">
              <FlaskConical className="size-3.5" /> See labs you can book
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
