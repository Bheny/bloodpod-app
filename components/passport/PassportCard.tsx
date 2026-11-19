"use client";

import { useState, type MouseEvent, type PointerEvent } from "react";
import Link from "next/link";
import { m, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { BadgeCheck, MapPin, RotateCw } from "lucide-react";
import { formatDate } from "@/lib/formatters";

// The Blood Card: blood type, eligibility and verification at a glance.
// Tap or click to turn it over; the back explains what the card is.
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
  const reduce = useReducedMotion();
  const [flipped, setFlipped] = useState(false);

  // Pointer position over the card, -0.5..0.5. It tilts a few degrees at most and
  // settles back, like a card resting in a hand, not a toy.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 140, damping: 18, mass: 0.6 });
  const sy = useSpring(py, { stiffness: 140, damping: 18, mass: 0.6 });
  const rotateY = useTransform(sx, [-0.5, 0.5], [-6, 6]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [5, -5]);
  const sheen = useTransform(
    [sx, sy],
    ([x, y]: number[]) => `radial-gradient(circle at ${(x + 0.5) * 100}% ${(y + 0.5) * 100}%, rgba(255,255,255,0.16), transparent 55%)`,
  );

  function onMove(e: PointerEvent<HTMLDivElement>) {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  }
  function onLeave() {
    px.set(0);
    py.set(0);
  }
  // A tap anywhere flips the card, except on its own links and buttons.
  function onTap(e: MouseEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("a,button")) return;
    setFlipped((f) => !f);
  }

  const faceCls =
    "col-start-1 row-start-1 relative overflow-hidden rounded-card bg-[linear-gradient(145deg,#2B2B33_0%,#17171C_55%,#0E0E12_100%)] text-white [backface-visibility:hidden] [-webkit-backface-visibility:hidden]";
  const flipBtn =
    "flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20";

  // Shared finish: faint weave, lit edge and the pointer-following sheen.
  const finish = (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: "repeating-linear-gradient(135deg, #fff 0 1px, transparent 1px 6px)" }}
      />
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-card ring-1 ring-inset ring-white/10" />
      <m.span aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: reduce ? undefined : sheen }} />
    </>
  );

  return (
    <div style={{ perspective: 1000 }}>
      <m.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        onPointerCancel={onLeave}
        onClick={onTap}
        style={{
          rotateX: reduce ? 0 : rotateX,
          rotateY: reduce ? 0 : rotateY,
          transformStyle: "preserve-3d",
          // Layered shadows give the card height off the page.
          boxShadow:
            "0 1px 0 rgba(255,255,255,0.14) inset, 0 -1px 0 rgba(0,0,0,0.5) inset, 0 2px 4px rgba(10,10,15,0.18), 0 14px 28px -8px rgba(10,10,15,0.38), 0 32px 48px -24px rgba(10,10,15,0.35)",
        }}
        className="relative cursor-pointer touch-pan-y rounded-card"
      >
        <m.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: reduce ? 0 : 0.6, ease: [0.4, 0, 0.2, 1] }}
          style={{ transformStyle: "preserve-3d" }}
          className="grid"
        >
          {/* Front */}
          <div aria-hidden={flipped} inert={flipped} className={`${faceCls} p-5 lg:p-8`}>
            <span className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-red/15 blur-xl lg:size-44" />
            {finish}

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
                <p
                  className="text-[56px] font-extrabold leading-none tracking-[-3px] text-red-fg lg:text-[88px]"
                  style={{ textShadow: "0 1px 0 rgba(255,255,255,0.18), 0 6px 14px rgba(0,0,0,0.45)" }}
                >
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
              <button type="button" aria-label="Flip card to see the back" onClick={() => setFlipped(true)} className={flipBtn}>
                <RotateCw className="size-4" />
              </button>
            </div>
          </div>

          {/* Back */}
          <div
            aria-hidden={!flipped}
            inert={!flipped}
            style={{ transform: "rotateY(180deg)" }}
            className={`${faceCls} flex flex-col`}
          >
            {finish}
            <div className="relative mt-5 h-9 bg-black/60 lg:mt-7 lg:h-11" />

            <div className="relative flex flex-1 flex-col justify-between gap-4 p-5 lg:p-8">
              <div>
                <p className="text-label font-bold uppercase tracking-[2px] text-white/70">About this card</p>
                <p className="mt-2 text-caption leading-relaxed text-white/80 lg:text-body-sm">
                  {verified
                    ? "A reviewer has checked a lab report against this profile. It still never replaces the hospital's own testing."
                    : "This card shows what you told us. Lab verification is coming with the pilot, and a hospital will always run its own tests."}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-white/[0.07] py-2">
                  <p className="text-title font-extrabold text-red-fg">{bloodType ?? "—"}</p>
                  <p className="text-label uppercase tracking-wide text-white/60">Type</p>
                </div>
                <div className="rounded-xl bg-white/[0.07] py-2">
                  <p className="text-title font-extrabold">{donationCount}</p>
                  <p className="text-label uppercase tracking-wide text-white/60">Given</p>
                </div>
                <div className="rounded-xl bg-white/[0.07] py-2">
                  <p className={isEligible ? "text-body-sm font-extrabold text-[#86EFAC]" : "text-body-sm font-extrabold text-[#F59E0B]"}>
                    {isEligible ? "Now" : nextEligible ? formatDate(nextEligible) : "—"}
                  </p>
                  <p className="text-label uppercase tracking-wide text-white/60">Eligible</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link href="/passport/log" className="flex-1 rounded-full bg-red py-2.5 text-center text-caption font-bold text-white">
                  Log a donation
                </Link>
                <Link href="/passport/share" className="flex-1 rounded-full bg-white/10 py-2.5 text-center text-caption font-bold text-white">
                  Share
                </Link>
                <button type="button" aria-label="Flip card back to the front" onClick={() => setFlipped(false)} className={flipBtn}>
                  <RotateCw className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </m.div>
      </m.div>
    </div>
  );
}
