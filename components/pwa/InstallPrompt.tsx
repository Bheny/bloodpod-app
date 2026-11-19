"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// Android/Chrome gets a one-tap install; iOS needs Share -> Add to Home Screen,
// which is also the only way web push works there, so the copy says so.
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [installed, setInstalled] = useState(true); // hidden until we know otherwise
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only detection
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    try {
      setDismissed(localStorage.getItem("bp-install-dismissed") === "1");
    } catch {}

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || dismissed || (!deferred && !isIOS)) return null;

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem("bp-install-dismissed", "1");
    } catch {}
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }

  return (
    <div className="rounded-2xl border border-ink-faint bg-card p-4 text-sm">
      <p className="font-semibold text-ink">Install BloodPod</p>
      <p className="mt-1 text-ink-mid">
        {isIOS
          ? "Tap Share, then Add to Home Screen. You need this to receive emergency alerts on iPhone."
          : "Add BloodPod to your home screen to get emergency alerts instantly."}
      </p>
      <div className="mt-3 flex gap-3">
        {deferred && (
          <button
            type="button"
            onClick={install}
            className="rounded-full bg-[#dd0000] px-4 py-2 font-semibold text-white"
          >
            Install
          </button>
        )}
        <button type="button" onClick={dismiss} className="px-2 py-2 text-ink-muted">
          Not now
        </button>
      </div>
    </div>
  );
}
