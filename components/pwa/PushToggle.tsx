"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

type State = "loading" | "unsupported" | "blocked" | "off" | "on";

export function PushToggle() {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        return setState("unsupported");
      }
      if (Notification.permission === "denied") return setState("blocked");
      const reg = await navigator.serviceWorker.ready;
      setState((await reg.pushManager.getSubscription()) ? "on" : "off");
    }
    init().catch(() => setState("unsupported"));
  }, []);

  async function enable() {
    setBusy(true);
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return setState(permission === "denied" ? "blocked" : "off");

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) throw new Error("save failed");
      setState("on");
    } catch {
      setMessage("Could not turn on alerts. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState("off");
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/push/test", { method: "POST" });
    setMessage(res.ok ? "Test alert sent." : "Could not send a test alert.");
    setBusy(false);
  }

  if (state === "loading") return null;

  return (
    <div className="rounded-3xl border-[0.5px] border-hairline bg-card lg:rounded-2xl px-3.5 py-3 text-caption shadow-raised lg:px-5 lg:py-4 lg:text-body-sm">
      <p className="font-bold text-ink">Emergency alerts</p>
      {state === "unsupported" && (
        <p className="mt-1 text-ink-mid">
          This browser can&apos;t receive alerts. On iPhone, add BloodPod to your Home Screen first.
        </p>
      )}
      {state === "blocked" && (
        <p className="mt-1 text-ink-mid">Alerts are blocked. Allow notifications for BloodPod in your browser settings.</p>
      )}
      {state === "off" && (
        <>
          <p className="mt-1 text-ink-mid">Get notified the moment someone near you needs blood.</p>
          <button
            type="button"
            onClick={enable}
            disabled={busy}
            className="mt-3 rounded-full bg-[#dd0000] px-4 py-2 font-semibold text-white disabled:opacity-50"
          >
            Turn on alerts
          </button>
        </>
      )}
      {state === "on" && (
        <>
          <p className="mt-1 text-ink-mid">Alerts are on for this device.</p>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={sendTest}
              disabled={busy}
              className="rounded-full bg-[#dd0000] px-4 py-2 font-semibold text-white disabled:opacity-50"
            >
              Send test alert
            </button>
            <button type="button" onClick={disable} disabled={busy} className="px-2 py-2 text-ink-muted">
              Turn off
            </button>
          </div>
        </>
      )}
      {message && <p className="mt-2 text-ink-mid">{message}</p>}
    </div>
  );
}
