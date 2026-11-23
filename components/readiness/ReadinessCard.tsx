import Link from "next/link";
import { CheckCircle2, Radio } from "lucide-react";
import type { PodReadiness } from "@/lib/readiness/drill";
import { Card } from "@/components/ui/Card";
import { DrillButton } from "@/components/readiness/ReadinessActions";
import { InfoTip } from "@/components/ui/InfoTip";

/** Is this Pod ready to answer? One honest number, the last drill, and the one thing to do next. */
export function ReadinessCard({ podId, readiness, headingLevel = "h2" }: { podId: string; readiness: PodReadiness; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  const { ready, needed, lastDrill } = readiness;
  const enough = ready >= needed;

  return (
    <Card>
      <p className="flex items-center gap-1.5 text-label font-bold uppercase tracking-wide text-red-fg">
        Pod readiness <InfoTip term="drill" />
      </p>
      <Heading className="mt-1 text-title font-extrabold leading-tight tracking-[-0.4px] text-ink">
        {enough ? "Your Pod can run a drill" : `${needed - ready} more ${needed - ready === 1 ? "person" : "people"} to run a drill`}
      </Heading>
      <p className="mt-1 text-caption text-ink-muted">
        {ready} {ready === 1 ? "person" : "people"} ready now (profile finished, able to give). A drill needs {needed}.
      </p>

      {lastDrill && (
        <Link
          href={`/pod/ready/drill/${lastDrill.id}`}
          className="mt-3 flex min-h-11 items-center justify-between rounded-2xl bg-surface px-4 text-body-sm text-ink"
        >
          <span className="flex items-center gap-2 font-semibold">
            {lastDrill.closedAt ? <CheckCircle2 className="size-4 text-ink-faint" aria-hidden /> : <Radio className="size-4 text-red-fg" aria-hidden />}
            Last drill
          </span>
          <span className="text-ink-muted">{lastDrill.closedAt ? (lastDrill.passed ? "Passed" : "Not yet") : "Running now"}</span>
        </Link>
      )}

      <div className="mt-4">
        {enough ? (
          <DrillButton podId={podId} />
        ) : (
          <Link href={`/pod/${podId}/invite`} className="flex min-h-11 items-center justify-center rounded-full bg-red px-5 text-body-sm font-bold text-white">
            Invite people you trust
          </Link>
        )}
      </div>
    </Card>
  );
}
