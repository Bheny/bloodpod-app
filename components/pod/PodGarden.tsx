import Link from "next/link";
import { Plus } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { FREE_POD_MEMBER_LIMIT } from "@/lib/pod-limits";
import type { PodMemberView } from "@/lib/pod-data";

/** Plots shown: 10 to start, which is the low end of "10 to 20 people", then up to the Pod's limit. */
const FIRST_GOAL = 10;

const BLOOD_ORDER = ["A+", "A−", "B+", "B−", "AB+", "AB−", "O+", "O−"];

function firstName(name: string) {
  return name.split(" ")[0] || name;
}

function Bloom() {
  return (
    <svg viewBox="0 0 56 64" className="bp-sway size-full" aria-hidden>
      <ellipse cx="28" cy="57" rx="18" ry="5" className="fill-soil" />
      <path d="M28 55 C28 44 28 36 28 26" stroke="#3E9B5B" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M28 46 C20 46 15 41 14 35 C21 35 27 39 28 46Z" fill="#4FB26C" />
      <path d="M28 40 C36 40 41 35 42 29 C35 29 29 33 28 40Z" fill="#4FB26C" />
      <g className="fill-red">
        <circle cx="28" cy="12" r="6" />
        <circle cx="35" cy="19" r="6" />
        <circle cx="28" cy="26" r="6" />
        <circle cx="21" cy="19" r="6" />
      </g>
      <circle cx="28" cy="19" r="4" fill="#FFC857" />
    </svg>
  );
}

function Seedling() {
  return (
    <svg viewBox="0 0 56 64" className="bp-sway size-full" aria-hidden>
      <ellipse cx="28" cy="57" rx="18" ry="5" className="fill-soil" />
      <path d="M28 55 C28 50 28 46 28 42" stroke="#3E9B5B" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M28 44 C20 44 15 39 14 33 C21 33 27 37 28 44Z" fill="#7CCB92" />
      <path d="M28 42 C35 42 40 37 41 31 C34 31 29 35 28 42Z" fill="#7CCB92" />
    </svg>
  );
}

function Plot({
  member,
  index,
  inviteHref,
}: {
  member: PodMemberView | null;
  index: number;
  inviteHref?: string;
}) {
  if (!member) {
    if (!inviteHref) {
      // Members can see the open spots but only the owner can fill them.
      return (
        <div className="flex flex-col items-center gap-1 py-1">
          <span className="flex aspect-square w-full max-w-14 items-center justify-center rounded-full border-[1.5px] border-dashed border-hairline" />
          <span className="text-label text-ink-faint">Open</span>
        </div>
      );
    }
    return (
      <Link
        href={inviteHref}
        aria-label="Invite someone to this spot"
        className="group flex flex-col items-center gap-1 rounded-xl py-1 transition-transform active:scale-95"
      >
        <span className="flex aspect-square w-full max-w-14 items-center justify-center rounded-full border-[1.5px] border-dashed border-red-mid bg-red-light/50 transition-colors group-hover:bg-red-light">
          <Plus className="size-5 text-red-fg" />
        </span>
        <span className="text-label font-bold text-red-fg">Invite</span>
      </Link>
    );
  }

  const ready = member.isEligible;
  return (
    <div
      className="bp-grow flex flex-col items-center gap-0.5 py-1"
      style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}
      title={ready ? `${member.name} is ready to donate` : `${member.name} is resting`}
    >
      <div className="aspect-56/64 w-full max-w-14">{ready ? <Bloom /> : <Seedling />}</div>
      <span className="max-w-full truncate text-label font-bold text-ink">
        {member.isCurrentUser ? "You" : firstName(member.name)}
      </span>
      <span className="text-label text-ink-muted">{member.bloodType ?? "—"}</span>
    </div>
  );
}

function Drop({ type, covered }: { type: string; covered: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 40 48" className="w-full max-w-11" aria-label={`${type} ${covered ? "covered" : "missing"}`}>
        <path
          d="M20 3 C20 3 5 22 5 31 a15 15 0 0 0 30 0 C35 22 20 3 20 3Z"
          className={covered ? "fill-red" : "fill-red-light stroke-red-mid"}
          strokeWidth={covered ? 0 : 1.5}
          strokeDasharray={covered ? undefined : "3 3"}
        />
        <text
          x="20"
          y="35"
          textAnchor="middle"
          fontSize="11"
          fontWeight="700"
          className={covered ? "fill-white" : "fill-red"}
        >
          {type}
        </text>
      </svg>
    </div>
  );
}

export function PodGarden({
  members,
  covered,
  gaps,
  inviteHref,
}: {
  members: PodMemberView[];
  covered: string[];
  gaps: string[];
  /** Where an empty plot leads. Leave out for members, who can't invite. */
  inviteHref?: string;
}) {
  const count = members.length;
  const seats = Math.max(count < FIRST_GOAL ? FIRST_GOAL : FREE_POD_MEMBER_LIMIT, count);
  const missing = seats - count;
  const readyCount = members.filter((m) => m.isEligible).length;

  const plots: (PodMemberView | null)[] = [...members, ...Array.from({ length: missing }, () => null)];
  const coveredSet = new Set(covered);
  const nextGap = gaps[0];

  return (
    <Card>
      <CardTitle
        aside={
          <span className="text-caption font-bold text-ink-muted">
            {count} of {FREE_POD_MEMBER_LIMIT} max
          </span>
        }
      >
        Your garden
      </CardTitle>
      <p className="mt-1 text-caption text-ink-muted lg:text-body-sm">
        {count < FIRST_GOAL
          ? `Aim for ${FIRST_GOAL} to ${FREE_POD_MEMBER_LIMIT} people you trust.`
          : missing > 0
            ? `Room for ${missing} more, up to ${FREE_POD_MEMBER_LIMIT}.`
            : `${inviteHref ? "Your" : "This"} Pod is full at ${FREE_POD_MEMBER_LIMIT}.`}
        {readyCount > 0 && ` ${readyCount} in bloom, ready to donate.`}
      </p>

      <div className="mt-3 grid grid-cols-5 gap-x-2 gap-y-2">
        {plots.map((member, i) => (
          <Plot key={member?.id ?? `empty-${i}`} member={member} index={i} inviteHref={inviteHref} />
        ))}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-label text-ink-muted">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-red" /> Bloom: ready to donate
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#7CCB92]" /> Seedling: resting
        </span>
      </div>

      <div className="mt-4 border-t-[0.5px] border-hairline pt-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-body-sm font-bold text-ink">Blood types</h3>
          <span className="text-caption font-bold text-ink-muted">
            {covered.length} of {BLOOD_ORDER.length}
          </span>
        </div>
        <p className="mt-1 text-caption text-ink-muted">
          {nextGap
            ? `Nobody with ${nextGap} yet. Someone with it would fill a drop.`
            : "Every blood type is covered."}
        </p>
        <div className="mt-3 grid grid-cols-4 gap-2 lg:grid-cols-8">
          {BLOOD_ORDER.map((type) => (
            <Drop key={type} type={type} covered={coveredSet.has(type)} />
          ))}
        </div>
      </div>
    </Card>
  );
}
