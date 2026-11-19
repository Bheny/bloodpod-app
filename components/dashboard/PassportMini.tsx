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
      className="relative block overflow-hidden rounded-2xl bg-[linear-gradient(145deg,#2B2B33_0%,#17171C_55%,#0E0E12_100%)] p-4.25 transition-transform duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 lg:p-6"
      style={{
        // Same bevelled edge and layered shadow as the full Blood Card.
        boxShadow:
          "0 1px 0 rgba(255,255,255,0.14) inset, 0 -1px 0 rgba(0,0,0,0.5) inset, 0 2px 4px rgba(10,10,15,0.18), 0 12px 24px -8px rgba(10,10,15,0.38), 0 26px 40px -22px rgba(10,10,15,0.35)",
      }}
    >
      <span
        className="pointer-events-none absolute -right-6 -top-6 size-20 rounded-full blur-lg lg:size-28"
        style={{ backgroundColor: "rgba(221,0,0,0.16)" }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: "repeating-linear-gradient(135deg, #fff 0 1px, transparent 1px 6px)" }}
      />
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: "radial-gradient(circle at 25% 0%, rgba(255,255,255,0.12), transparent 55%)" }}
      />

      <div className="relative flex items-start justify-between">
        <span className="text-label font-bold uppercase tracking-wide text-white/70">
          Blood Card
        </span>
        {verificationStatus === "VERIFIED" ? (
          <span
            className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-label font-bold"
            style={{
              backgroundColor: "rgba(22,163,74,0.15)",
              borderColor: "rgba(22,163,74,0.3)",
              color: "#86EFAC",
            }}
          >
            <ShieldCheck className="size-2.5 lg:size-3" />
            Verified
          </span>
        ) : (
          <span className="rounded-full bg-white/8 px-2 py-0.5 text-label font-semibold text-white/70">
            Self-reported
          </span>
        )}
      </div>

      <div className="relative mt-3 flex items-end justify-between lg:mt-5">
        <div>
          <p className="text-sm font-extrabold tracking-[-0.4px] text-white lg:text-base">
            {name ?? "You"}
          </p>
          <p className="text-label text-white/70">{city ?? "Ghana"}</p>
          <p
            className="mt-1 text-[38px] font-extrabold leading-none tracking-[-2px] text-red-fg lg:text-[52px]"
            style={{ textShadow: "0 1px 0 rgba(255,255,255,0.18), 0 5px 12px rgba(0,0,0,0.45)" }}
          >
            {bloodType ?? "—"}
          </p>
          <p className="mt-1 text-label font-bold uppercase tracking-wide text-white/70">
            Blood type
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <div className="text-right">
            <p className="text-lg font-bold text-white lg:text-2xl">{donationCount}</p>
            <p className="text-label font-bold uppercase tracking-wide text-white/70">
              Donation{donationCount === 1 ? "" : "s"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-white lg:text-2xl">{podCount}</p>
            <p className="text-label font-bold uppercase tracking-wide text-white/70">
              Pod{podCount === 1 ? "" : "s"}
            </p>
          </div>
          <p
            className="text-xs font-bold lg:text-sm"
            style={{ color: isEligible ? "#86EFAC" : "#F59E0B" }}
          >
            {isEligible ? "Eligible" : "Not yet"}
          </p>
        </div>
      </div>

      <div className="relative my-3 h-px bg-white/[0.07]" />

      <div className="relative flex items-center justify-between">
        <p className="text-label text-white/70">
          Next eligible{" "}
          <span className="text-white/70">
            {isEligible ? "Now" : nextEligible ? formatDate(nextEligible) : "—"}
          </span>
        </p>
        <QrCode className="size-5 text-white/60 lg:size-6" />
      </div>
    </Link>
  );
}
