import Link from "next/link";
import { ShieldCheck, QrCode } from "lucide-react";
import { formatDate } from "@/lib/formatters";

export function PassportMini({
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
    <Link
      href="/passport"
      className="relative block overflow-hidden rounded-2xl bg-ink p-4.25 lg:p-6"
    >
      <span
        className="pointer-events-none absolute -right-6 -top-6 size-20 rounded-full lg:size-28"
        style={{ backgroundColor: "rgba(221,0,0,0.1)" }}
      />

      <div className="relative flex items-start justify-between">
        <span className="text-[9px] font-bold uppercase tracking-wide text-white/25 lg:text-[11px]">
          Donation passport
        </span>
        {verificationStatus === "VERIFIED" ? (
          <span
            className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold lg:text-[11px]"
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
          <span className="rounded-full bg-white/8 px-2 py-0.5 text-[9px] font-semibold text-white/50 lg:text-[11px]">
            Unverified
          </span>
        )}
      </div>

      <div className="relative mt-3 flex items-end justify-between lg:mt-5">
        <div>
          <p className="text-sm font-extrabold tracking-[-0.4px] text-white lg:text-base">
            {name ?? "You"}
          </p>
          <p className="text-[9px] text-white/30 lg:text-[11px]">{city ?? "Ghana"}</p>
          <p className="mt-1 text-[38px] font-extrabold leading-none tracking-[-2px] text-red lg:text-[52px]">
            {bloodType ?? "—"}
          </p>
          <p className="mt-1 text-[8px] font-bold uppercase tracking-wide text-white/20 lg:text-[10px]">
            Blood type
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <div className="text-right">
            <p className="text-lg font-bold text-white lg:text-2xl">{donationCount}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-white lg:text-2xl">{podCount}</p>
          </div>
          <p
            className="text-xs font-bold lg:text-sm"
            style={{ color: isEligible ? "#86EFAC" : "#F59E0B" }}
          >
            {isEligible ? "Active" : "Waiting"}
          </p>
        </div>
      </div>

      <div className="relative my-3 h-px bg-white/[0.07]" />

      <div className="relative flex items-center justify-between">
        <p className="text-[10px] text-white/40 lg:text-[12px]">
          Next eligible{" "}
          <span className="text-white/70">
            {isEligible ? "Now" : nextEligible ? formatDate(nextEligible) : "—"}
          </span>
        </p>
        <QrCode className="size-5 text-white/18 lg:size-6" />
      </div>
    </Link>
  );
}
