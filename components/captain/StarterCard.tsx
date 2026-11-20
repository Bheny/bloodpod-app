import Link from "next/link";
import { Check, Circle } from "lucide-react";
import type { CaptainResult } from "@/lib/captain/types";
import { Card } from "@/components/ui/Card";
import { DrillButton } from "@/components/captain/CaptainActions";

/**
 * Where a Pod stands and the one thing to do next. Used on the Pod screen and on /captain, so the
 * checklist is the same everywhere: it comes straight from computeCaptainLevel.
 */
export function StarterCard({ podId, result, headingLevel = "h2" }: { podId: string; result: CaptainResult; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  const next = result.checklist.find((c) => !c.done);

  return (
    <Card>
      <p className="text-label font-bold uppercase tracking-wide text-red-fg">{result.title}</p>
      <Heading className="mt-1 text-title font-extrabold leading-tight tracking-[-0.4px] text-ink">
        {result.nextTitle ? `On the way to ${result.nextTitle}` : "You have reached the top"}
      </Heading>

      {result.checklist.length > 0 && (
        <ul className="mt-3 space-y-2.5">
          {result.checklist.map((item) => (
            <li key={item.key} className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${item.done ? "bg-success-strong text-white" : "border border-hairline text-ink-faint"}`}
                aria-hidden
              >
                {item.done ? <Check className="size-3" /> : <Circle className="size-2" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-body-sm font-semibold ${item.done ? "text-ink-muted line-through" : "text-ink"}`}>{item.label}</span>
                {item.detail && !item.done && <span className="block text-caption text-ink-muted">{item.detail}</span>}
                <span className="sr-only">{item.done ? "Done" : "Not done yet"}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      {next?.action === "invite" && (
        <Link
          href={`/pod/${podId}/invite`}
          className="mt-4 flex min-h-11 items-center justify-center rounded-full bg-red px-5 text-body-sm font-bold text-white transition-transform active:scale-[0.98] motion-reduce:transition-none"
        >
          Invite people
        </Link>
      )}
      {next?.action === "drill" && (
        <div className="mt-4">
          <DrillButton podId={podId} />
        </div>
      )}
      {next?.action === "spinoff" && (
        <p className="mt-4 rounded-2xl bg-red-light px-4 py-3 text-caption text-ink-mid">
          Ask someone you brought into your Pod to start a Pod from their own invites. It grows from there.
        </p>
      )}

      <Link href="/captain" className="mt-3 inline-flex min-h-11 items-center text-body-sm font-bold text-red-fg">
        See the full picture
      </Link>
    </Card>
  );
}
