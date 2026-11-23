import Link from "next/link";
import { BadgeCheck, CheckCircle2, CreditCard, Droplet, Plus, Users, type LucideIcon } from "lucide-react";
import { daysUntil } from "@/lib/eligibility";
import { formatDate, formatRelativeTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { InfoTip } from "@/components/ui/InfoTip";
import type { TermId } from "@/lib/glossary";

/** The shell every small tile shares, so they line up and feel like one set. */
export const tileClass =
  "flex h-full min-h-[148px] flex-col rounded-3xl border-[0.5px] border-hairline bg-card p-4 shadow-raised transition-transform active:scale-[0.98]";

export function TileLabel({ icon: Icon, children, tip }: { icon: LucideIcon; children: React.ReactNode; tip?: TermId }) {
  return (
    <p className="flex items-center gap-1.5 text-caption font-semibold text-ink-muted">
      <Icon className="size-3.5" /> {children}
      {tip && <InfoTip term={tip} className="-my-1" />}
    </p>
  );
}

export function BloodCardTile({ bloodType, verified, podCount = 0 }: { bloodType: string | null; verified: boolean; podCount?: number }) {
  if (!bloodType) {
    return (
      <Link href="/profile/edit" className={tileClass}>
        <TileLabel icon={CreditCard} tip="bloodCard">Blood Card</TileLabel>
        <span className="mt-4 flex size-11 items-center justify-center rounded-full bg-red-light">
          <Plus className="size-5 text-red-fg" />
        </span>
        <p className="mt-auto text-body-sm font-bold leading-tight text-ink">Add your blood group</p>
        <p className="text-caption text-ink-muted">Takes 10 seconds</p>
      </Link>
    );
  }

  return (
    <Link href="/passport" className={tileClass}>
      <TileLabel icon={CreditCard} tip="bloodCard">Blood Card</TileLabel>
      <p className="mt-3 text-[48px] font-extrabold leading-none tracking-[-2px] text-red-fg">{bloodType}</p>
      <p className="mt-auto text-caption font-semibold text-ink">
        {podCount} {podCount === 1 ? "Pod" : "Pods"}
      </p>
      <p className="flex items-center gap-1 text-caption font-semibold text-ink-muted">
        {verified ? (
          <>
            <BadgeCheck className="size-3.5 text-success-strong" /> <span className="text-success-strong">Lab-verified</span>
          </>
        ) : (
          "Works offline"
        )}
      </p>
    </Link>
  );
}

const WINDOW_DAYS = 90;

export function NextDonationTile({
  isEligible,
  nextEligible,
  lastDonated,
}: {
  isEligible: boolean;
  nextEligible: Date | string | null;
  lastDonated: Date | string | null;
}) {
  const resting = !isEligible && nextEligible;
  const days = resting ? daysUntil(nextEligible) : 0;
  const progress = resting ? Math.min(Math.max(1 - days / WINDOW_DAYS, 0.04), 1) : 1;

  return (
    <Link href="/passport/log" className={tileClass}>
      <TileLabel icon={Droplet} tip="eligible">Next donation</TileLabel>
      {resting ? (
        <>
          <p className="mt-3 text-[40px] font-extrabold leading-none tracking-[-1.5px] text-ink">
            {days}
            <span className="ml-1 text-body-sm font-bold tracking-normal text-ink-muted">{days === 1 ? "day" : "days"}</span>
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-hairline">
            <div className="h-full rounded-full bg-success-strong" style={{ width: `${progress * 100}%` }} />
          </div>
          <p className="mt-auto pt-2 text-caption font-semibold text-ink-muted">Eligible {formatDate(nextEligible)}</p>
        </>
      ) : (
        <>
          <span className="mt-3 flex size-11 items-center justify-center rounded-full bg-success-soft">
            <CheckCircle2 className="size-6 text-success-strong" />
          </span>
          <p className="mt-3 text-[20px] font-extrabold leading-tight tracking-[-0.5px] text-success-strong">Eligible now</p>
          <p className="mt-auto pt-2 text-caption text-ink-muted" suppressHydrationWarning>
            {lastDonated ? `Last gave ${formatRelativeTime(lastDonated)}` : "Ready when you are"}
          </p>
        </>
      )}
    </Link>
  );
}

export function NetworkTile({ people, pods, ready }: { people: number; pods: number; ready: number }) {
  return (
    <Link href="/pod" className={tileClass}>
      <TileLabel icon={Users}>Your network</TileLabel>
      <p className="mt-3 text-[40px] font-extrabold leading-none tracking-[-1.5px] text-ink">{people}</p>
      <p className="mt-1 text-caption text-ink-muted">
        {people === 1 ? "person" : "people"} in {pods} {pods === 1 ? "Pod" : "Pods"}
      </p>
      <p className="mt-auto pt-2 text-caption font-semibold text-success-strong">{ready} can donate now</p>
    </Link>
  );
}

export function ActionTile({ href, label, icon: Icon }: { href: string; label: string; icon: LucideIcon }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-3xl border-[0.5px] border-hairline bg-card lg:rounded-2xl px-4 py-3.5 shadow-raised transition-transform active:scale-[0.98]",
      )}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-fill">
        <Icon className="size-[18px] text-ink-mid" />
      </span>
      <span className="text-body-sm font-bold text-ink">{label}</span>
    </Link>
  );
}
