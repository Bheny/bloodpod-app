"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const VISITOR_KEY = "bp_vid";
const SESSION_KEY = "bp_sess";
/** A visit ends after this long without a page view. */
const VISIT_GAP_MS = 30 * 60_000;

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

/** Honour "Do Not Track" and Global Privacy Control: nothing is recorded, nothing is stored on the device. */
function optedOut(): boolean {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean; msDoNotTrack?: string };
  return nav.doNotTrack === "1" || nav.msDoNotTrack === "1" || nav.globalPrivacyControl === true;
}

function visitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = newId();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    // Storage blocked: this page view counts as its own visitor rather than failing.
    return newId();
  }
}

/** The current visit, and whether this is its first page view. */
function visit(): { id: string; entry: boolean } {
  const now = Date.now();
  try {
    const saved = JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null") as { id: string; t: number } | null;
    if (saved && now - saved.t < VISIT_GAP_MS) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ id: saved.id, t: now }));
      return { id: saved.id, entry: false };
    }
    const id = newId();
    localStorage.setItem(SESSION_KEY, JSON.stringify({ id, t: now }));
    return { id, entry: true };
  } catch {
    return { id: newId(), entry: true };
  }
}

/**
 * BloodPod's own page-view counter. It sends the page, a random id this browser made for itself and,
 * on the first page of a visit, where the person came from. No cookies, no third party, no query strings
 * and nothing typed on a page. Read by the admin Analytics page.
 */
export function Tracker() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (last.current === pathname) return;
    last.current = pathname;
    if (pathname.startsWith("/admin") || optedOut()) return;

    const v = visit();
    const params = new URLSearchParams(window.location.search);
    const payload = JSON.stringify({
      p: pathname,
      v: visitorId(),
      s: v.id,
      n: v.entry,
      i: window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true,
      // Only the first page of a visit says where it came from.
      ...(v.entry ? { r: document.referrer, us: params.get("utm_source"), uc: params.get("utm_campaign") } : {}),
    });

    try {
      if (!navigator.sendBeacon?.("/api/t", new Blob([payload], { type: "application/json" }))) {
        void fetch("/api/t", { method: "POST", body: payload, headers: { "Content-Type": "application/json" }, keepalive: true });
      }
    } catch {
      // Not worth interrupting anyone over.
    }
  }, [pathname]);

  return null;
}
