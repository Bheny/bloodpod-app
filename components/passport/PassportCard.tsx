"use client";

import { m } from "framer-motion";
import { BadgeCheck, MapPin, QrCode } from "lucide-react";
import { formatDate } from "@/lib/formatters";

// The Blood Card: blood type, eligibility and verification at a glance.
export function PassportCard({
  name,
  city,
  bloodType,
  donationCount,
  podCount,
  isEligible,
  nextEligible,
  verificationStatus,
}: {
  name: string | null;
  city: string | null;
  bloodType: string | null;
  donationCount: number;
  podCount: number;
  isEligible: boolean;
  nextEligible: Date | string | null;
  verificationStatus: string;
}) {
  const verified = verificationStatus === "VERIFIED";

  return (
    <m.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="relative overflow-hidden rounded-card bg-ink p-5 text-white shadow-raised lg:p-8"
    >
      <span className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-red/10 lg:size-44" />

      <div className="relative flex items-start justify-between">
        <span className="text-label font-bold uppercase tracking-[2px] text-white/70">Blood Card</span>
        <span
          className={
            verified
              ? "flex items-center gap-1.5 rounded-full bg-[#16A34A]/20 px-3 py-1 text-caption font-bold text-[#86EFAC]"
              : "rounded-full bg-white/10 px-3 py-1 text-caption font-semibold text-white/80"
          }
        >
          {verified && <BadgeCheck className="size-3.5" />}
          {verified ? "Lab-verified" : "Self-reported"}
        </span>
      </div>

      <div className="relative mt-5 flex items-end justify-between gap-4 lg:mt-8">
        <div className="min-w-0">
          <p className="text-[56px] font-extrabold leading-none tracking-[-3px] text-red lg:text-[88px]">
            {bloodType ?? "—"}
          </p>
          <p className="mt-3 truncate text-title font-extrabold tracking-[-0.4px] lg:text-title-lg">{name ?? "You"}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-caption text-white/70 lg:text-body-sm">
            <MapPin className="size-3.5" /> {city ?? "Ghana"}
          </p>
        </div>

        <div className="flex shrink-0 gap-6 text-right lg:flex-col lg:gap-4">
          <div>
            <p className="text-title font-bold lg:text-title-lg">{donationCount}</p>
            <p className="text-label uppercase tracking-wide text-white/70">Donation{donationCount === 1 ? "" : "s"}</p>
          </div>
          <div>
            <p className="text-title font-bold lg:text-title-lg">{podCount}</p>
            <p className="text-label uppercase tracking-wide text-white/70">Pod{podCount === 1 ? "" : "s"}</p>
          </div>
        </div>
      </div>

      <div className="relative my-5 h-px bg-white/10 lg:my-6" />

      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-label uppercase tracking-wide text-white/70">Next eligible</p>
          <p className={isEligible ? "text-body-sm font-bold text-[#86EFAC] lg:text-title" : "text-body-sm font-bold text-[#F59E0B] lg:text-title"}>
            {isEligible ? "Now, ready to donate" : nextEligible ? formatDate(nextEligible) : "—"}
          </p>
        </div>
        <QrCode className="size-7 text-white/50 lg:size-9" />
      </div>
    </m.div>
  );
}
