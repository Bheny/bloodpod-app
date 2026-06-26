import Link from "next/link";
import { Building2, Droplet, FlaskConical, ShieldCheck } from "lucide-react";
import type { Partner } from "@prisma/client";

const TYPE_STYLES: Record<Partner["type"], { label: string; icon: typeof Building2; bg: string; color: string }> = {
  HOSPITAL: { label: "Hospital", icon: Building2, bg: "#EFF6FF", color: "#1D4ED8" },
  BLOOD_BANK: { label: "Blood bank", icon: Droplet, bg: "#FFF0F0", color: "#DD0000" },
  LAB: { label: "Lab", icon: FlaskConical, bg: "#F5F3FF", color: "#6D28D9" },
};

export function PartnerCard({ partner }: { partner: Partner }) {
  const style = TYPE_STYLES[partner.type];
  const Icon = style.icon;

  return (
    <Link
      href={`/discover/partner/${partner.id}`}
      className="flex w-[150px] shrink-0 snap-start flex-col gap-1.5 rounded-2xl border-[0.5px] border-[#E5E5EA] bg-white p-3"
    >
      <span
        className="flex size-9 items-center justify-center rounded-xl"
        style={{ backgroundColor: style.bg }}
      >
        <Icon className="size-[18px]" style={{ color: style.color }} />
      </span>

      <p className="line-clamp-2 text-[11px] font-bold leading-tight text-ink">{partner.name}</p>
      <p className="text-[9px] text-ink-muted">{partner.city}</p>

      <div className="mt-0.5 flex items-center gap-1">
        {partner.verified && <ShieldCheck className="size-3 text-[#166534]" />}
        <span className="text-[8px] font-semibold text-ink-faint">{style.label}</span>
      </div>
    </Link>
  );
}
