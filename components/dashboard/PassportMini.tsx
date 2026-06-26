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
      className="relative block overflow-hidden rounded-2xl bg-ink p-[17px]"
    >
      <span
        className="pointer-events-none absolute -right-6 -top-6 size-20 rounded-full"
        style={{ backgroundColor: "rgba(221,0,0,0.1)" }}
      />

      <div className="relative flex items-start justify-between">
        <span className="text-[9px] font-bold uppercase tracking-wide text-white/25">
          Donation passport
        </span>
        {verificationStatus === "VERIFIED" ? (
          <span
            className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold"
            style={{
              backgroundColor: "rgba(221,0,0,0.15)",
              borderColor: "rgba(221,0,0,0.3)",
              color: "#FF8080",
            }}
          >
            <ShieldCheck className="size-2.5" />
            Verified
          </span>
        ) : (
          <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[9px] font-semibold text-white/50">
            Unverified
          </span>
        )}
      </div>

      <div className="relative mt-3 flex items-end justify-between">
        <div>
          <p className="text-sm font-extrabold tracking-[-0.4px] text-white">{name ?? "You"}</p>
          <p className="text-[9px] text-white/30">{city ?? "Ghana"}</p>
          <p className="mt-1 text-[38px] font-extrabold leading-none tracking-[-2px] text-red">
            {bloodType ?? "—"}
          </p>
          <p className="mt-1 text-[8px] font-bold uppercase tracking-wide text-white/20">
            Blood type
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <div className="text-right">
            <p className="text-lg font-bold text-white">{donationCount}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-white">{podCount}</p>
          </div>
          <p
            className="text-xs font-bold"
            style={{ color: isEligible ? "#86EFAC" : "#F59E0B" }}
          >
            {isEligible ? "Active" : "Waiting"}
          </p>
        </div>
      </div>

      <div className="relative my-3 h-px bg-white/[0.07]" />

      <div className="relative flex items-center justify-between">
        <p className="text-[10px] text-white/40">
          Next eligible{" "}
          <span className="text-white/70">
            {isEligible ? "Now" : nextEligible ? formatDate(nextEligible) : "—"}
          </span>
        </p>
        <QrCode className="size-5 text-white/[0.18]" />
      </div>
    </Link>
  );
}
