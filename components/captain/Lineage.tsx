import Link from "next/link";
import type { Health, LineageNode } from "@/lib/captain/view";

const HEALTH: Record<Health, { label: string; tone: string }> = {
  working: { label: "Working", tone: "bg-success-soft text-success-strong" },
  needs_people: { label: "Needs people", tone: "bg-warn-soft text-warn-strong" },
  quiet: { label: "Gone quiet", tone: "bg-warn-soft text-warn-strong" },
  check: { label: "We will take a look", tone: "bg-surface text-ink-mid" },
};

export function HealthPill({ health }: { health: Health }) {
  const h = HEALTH[health];
  return <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-label font-bold ${h.tone}`}>{h.label}</span>;
}

function Node({ node, depth }: { node: LineageNode; depth: number }) {
  return (
    <li>
      <div className="flex items-center gap-2 py-2" style={{ paddingLeft: depth * 16 }}>
        <span className="text-ink-faint" aria-hidden>
          {depth > 0 ? "└" : ""}
        </span>
        <div className="min-w-0 flex-1">
          <Link href={`/pod/${node.podId}`} className="block truncate text-body-sm font-semibold text-ink">
            {node.name}
          </Link>
          {node.leaderName && <span className="block truncate text-caption text-ink-muted">Led by {node.leaderName}</span>}
        </div>
        <HealthPill health={node.health} />
      </div>
      {node.children.length > 0 && (
        <ul>
          {node.children.map((c) => (
            <Node key={c.podId} node={c} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

/** The Pods that grew out of yours, as a plain indented list. */
export function Lineage({ nodes }: { nodes: LineageNode[] }) {
  return (
    <ul className="divide-y-[0.5px] divide-hairline">
      {nodes.map((n) => (
        <Node key={n.podId} node={n} depth={0} />
      ))}
    </ul>
  );
}
