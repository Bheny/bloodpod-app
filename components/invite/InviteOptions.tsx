"use client";

import { useState } from "react";
import { Mail, Share2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[15px]" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.555 4.114 1.524 5.84L0 24l6.32-1.488A11.93 11.93 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0Zm0 21.818a9.78 9.78 0 0 1-5.013-1.378l-.36-.214-3.75.883.901-3.65-.234-.374A9.79 9.79 0 1 1 21.818 12 9.79 9.79 0 0 1 12 21.818Zm5.37-7.337c-.295-.148-1.747-.862-2.018-.96-.27-.099-.467-.148-.664.148-.197.295-.762.96-.935 1.157-.172.197-.345.222-.64.074-.295-.148-1.244-.459-2.37-1.464-.876-.78-1.467-1.745-1.64-2.04-.172-.296-.018-.456.13-.604.148-.148.33-.385.494-.578.165-.193.22-.33.33-.55.11-.222.055-.413-.043-.578-.099-.165-.886-2.135-1.214-2.917-.32-.769-.646-.665-.886-.677l-.756-.014c-.247 0-.65.092-.886.413-.235.32-.9.881-.9 2.148s.926 2.493 1.055 2.665c.13.172 1.79 2.732 4.34 3.724 2.55.992 2.55.661 3.012.62.461-.04 1.502-.605 1.715-1.19.213-.585.213-1.087.148-1.19-.065-.104-.197-.165-.493-.313Z" />
    </svg>
  );
}

export function InviteOptions({
  podId,
  podName,
  podSlug,
}: {
  podId: string;
  podName: string;
  podSlug: string;
}) {
  const [copied, setCopied] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSentTo, setEmailSentTo] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  const fullUrl = `https://bloodpod.gh/pod/${podSlug}`;
  const whatsAppText = encodeURIComponent(
    `I just built my emergency blood network on BloodPod. If anything ever happened to me, I'd want you in my circle. Join my pod here: ${fullUrl}`,
  );

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard access can fail silently in some browser contexts
    }
  }

  function handleWhatsApp() {
    window.open(`https://wa.me/?text=${whatsAppText}`, "_blank", "noopener,noreferrer");
  }

  async function handleSendEmail() {
    setEmailError(null);
    setSendingEmail(true);
    try {
      const res = await fetch("/api/pod/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, podId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setEmailSentTo(email);
      setEmail("");
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSendingEmail(false);
    }
  }

  async function handleMore() {
    if (navigator.share) {
      try {
        await navigator.share({ title: podName, text: "Join my pod on BloodPod", url: fullUrl });
      } catch {
        // user cancelled the native share sheet
      }
    } else {
      handleCopy();
    }
  }

  return (
    <div className="px-4 py-4">
      <div className="rounded-2xl bg-surface p-3">
        <p className="text-[11px] font-extrabold text-ink">{podName}</p>
        <p className="mb-1.5 text-[8px] text-ink-faint">bloodpod.gh/pod/{podSlug}</p>

        <div className="rounded-xl border border-[#E5E5EA] bg-white px-2.5 py-2">
          <p className="truncate text-[9px] font-medium text-red">{fullUrl}</p>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="mt-2 w-full rounded-full py-2 text-[9px] font-bold text-white transition-colors duration-200"
          style={{ backgroundColor: copied ? "#22C55E" : "#1C1C1E" }}
        >
          {copied ? "Copied ✓" : "Copy pod link"}
        </button>
      </div>

      <p className="mt-5 text-[9px] font-bold uppercase tracking-wide text-ink-muted">Share via</p>

      <div className="mt-2 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={handleWhatsApp}
          className="flex items-center gap-2.5 rounded-xl bg-white px-2.5 py-[9px] text-left"
        >
          <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-[#E8F5E9] text-[#25D366]">
            <WhatsAppIcon />
          </span>
          <span>
            <p className="text-[10px] font-bold text-ink">WhatsApp</p>
            <p className="text-[8px] text-ink-muted">Recommended · send to contacts</p>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setShowEmailInput((v) => !v)}
          className="flex items-center gap-2.5 rounded-xl bg-white px-2.5 py-[9px] text-left"
        >
          <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-red-light text-red">
            <Mail className="size-3.5" />
          </span>
          <span>
            <p className="text-[10px] font-bold text-ink">Email invite</p>
            <p className="text-[8px] text-ink-muted">Send a direct invite link</p>
          </span>
        </button>

        {showEmailInput && (
          <div className="rounded-xl bg-white px-2.5 py-2.5">
            {emailSentTo ? (
              <p className="text-xs font-semibold text-[#1FA855]">
                Invite sent to {emailSentTo} ✓
              </p>
            ) : (
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 text-xs"
                />
                <Button onClick={handleSendEmail} loading={sendingEmail} disabled={!email} size="sm">
                  Send →
                </Button>
              </div>
            )}
            {emailError && <p className="mt-1.5 text-xs text-red">{emailError}</p>}
          </div>
        )}

        <button
          type="button"
          onClick={handleMore}
          className="flex items-center gap-2.5 rounded-xl bg-white px-2.5 py-[9px] text-left"
        >
          <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-surface text-ink">
            <Share2 className="size-3.5" />
          </span>
          <span>
            <p className="text-[10px] font-bold text-ink">More options</p>
            <p className="text-[8px] text-ink-muted">X, LinkedIn, SMS</p>
          </span>
        </button>
      </div>
    </div>
  );
}
