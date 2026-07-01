"use client";

import { m } from "framer-motion";
import { ShieldCheck, QrCode } from "lucide-react";
import { formatDate } from "@/lib/formatters";

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
  return (
    <m.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="relative mx-2.5 mt-2.5 overflow-hidden rounded-2xl bg-ink p-4.5 lg:mx-6 lg:p-7"
    >
      <span
        className="pointer-events-none absolute -right-6 -top-6 size-20 rounded-full lg:size-28"
        style={{ backgroundColor: "rgba(221,0,0,0.1)" }}
      />

      <div className="relative flex items-start justify-between">
        <span className="text-[8px] font-bold uppercase tracking-[2px] text-white/25 lg:text-[10px]">
          BloodPod
        </span>
        {verificationStatus === "VERIFIED" ? (
          <span
            className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-[8px] font-bold lg:text-[10px]"
            style={{
              backgroundColor: "rgba(221,0,0,0.15)",
              borderColor: "rgba(221,0,0,0.3)",
              color: "#FF8080",
            }}
          >
            <ShieldCheck className="size-2.5 lg:size-3" />
            Verified
          </span>
        ) : (
          <span className="rounded-full bg-white/8 px-2 py-0.5 text-[8px] font-semibold text-white/50 lg:text-[10px]">
            Add a donation to verify
          </span>
        )}
      </div>

      <div className="relative mt-3 flex items-end justify-between lg:mt-6">
        <div>
          <p className="text-sm font-extrabold tracking-[-0.4px] text-white lg:text-base">
            {name ?? "You"}
          </p>
          <p className="text-[9px] text-white/30 lg:text-[11px]">{city ?? "Ghana"}</p>
          <p className="mt-1 text-[40px] font-extrabold leading-none tracking-[-2px] text-red lg:text-[56px]">
            {bloodType ?? "—"}
          </p>
          <p className="mt-1 text-[8px] font-bold uppercase tracking-[1.5px] text-white/20 lg:text-[10px]">
            Blood type
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="text-right">
            <p className="text-base font-bold text-white lg:text-xl">{donationCount}</p>
            <p className="text-[8px] uppercase text-white/20 lg:text-[10px]">Donations</p>
          </div>
          <div className="text-right">
            <p className="text-base font-bold text-white lg:text-xl">{podCount}</p>
            <p className="text-[8px] uppercase text-white/20 lg:text-[10px]">Pods</p>
          </div>
          <p
            className="text-[11px] font-bold lg:text-[13px]"
            style={{ color: isEligible ? "#86EFAC" : "#F59E0B" }}
          >
            {isEligible ? "Active" : `Eligible ${nextEligible ? formatDate(nextEligible) : ""}`}
          </p>
        </div>
      </div>

      <div className="relative my-3 h-px bg-white/[0.07]" />

      <div className="relative flex items-center justify-between">
        <p className="text-[10px] text-white/50 lg:text-[12px]">
          Next eligible{" "}
          <span style={{ color: "#86EFAC" }}>
            {isEligible ? "Now — ready to donate" : nextEligible ? formatDate(nextEligible) : "—"}
          </span>
        </p>
        <QrCode className="size-5 text-white/18 lg:size-6" />
      </div>
    </m.div>
  );
}
