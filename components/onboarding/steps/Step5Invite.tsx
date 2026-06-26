"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.555 4.114 1.524 5.84L0 24l6.32-1.488A11.93 11.93 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0Zm0 21.818a9.78 9.78 0 0 1-5.013-1.378l-.36-.214-3.75.883.901-3.65-.234-.374A9.79 9.79 0 1 1 21.818 12 9.79 9.79 0 0 1 12 21.818Zm5.37-7.337c-.295-.148-1.747-.862-2.018-.96-.27-.099-.467-.148-.664.148-.197.295-.762.96-.935 1.157-.172.197-.345.222-.64.074-.295-.148-1.244-.459-2.37-1.464-.876-.78-1.467-1.745-1.64-2.04-.172-.296-.018-.456.13-.604.148-.148.33-.385.494-.578.165-.193.22-.33.33-.55.11-.222.055-.413-.043-.578-.099-.165-.886-2.135-1.214-2.917-.32-.769-.646-.665-.886-.677l-.756-.014c-.247 0-.65.092-.886.413-.235.32-.9.881-.9 2.148s.926 2.493 1.055 2.665c.13.172 1.79 2.732 4.34 3.724 2.55.992 2.55.661 3.012.62.461-.04 1.502-.605 1.715-1.19.213-.585.213-1.087.148-1.19-.065-.104-.197-.165-.493-.313Z" />
    </svg>
  );
}

export function Step5Invite({
  podId,
  podSlug,
  onNext,
}: {
  podId: string | null;
  podSlug: string | null;
  onNext: () => void;
}) {
  const [inviteSent, setInviteSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSentTo, setEmailSentTo] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showSkipWarning, setShowSkipWarning] = useState(false);

  const podUrl = `bloodpod.gh/pod/${podSlug ?? ""}`;
  const whatsAppText = encodeURIComponent(
    `I just built my emergency blood network on BloodPod. If anything ever happened to me, I'd want you in my circle. Join my pod here: ${podUrl}`,
  );

  function handleWhatsApp() {
    window.open(`https://wa.me/?text=${whatsAppText}`, "_blank", "noopener,noreferrer");
    setInviteSent(true);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(podUrl);
      setCopied(true);
      setInviteSent(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard access can fail silently in some browser contexts
    }
  }

  async function handleSendEmail() {
    if (!email || !podId) return;
    setSendingEmail(true);
    try {
      await fetch(`/api/pods/${podId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setEmailSentTo(email);
      setInviteSent(true);
    } catch {
      // never block onboarding progress on a network hiccup
    } finally {
      setSendingEmail(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col px-6 py-10">
      <div className="flex-1">
        <div className="inline-flex items-center gap-2 rounded-full bg-red-light px-3 py-1.5">
          <span className="size-1.5 animate-pulse-dot rounded-full bg-[#AA0000]" />
          <span className="text-xs font-bold text-[#AA0000]">Pod is empty</span>
        </div>

        <h1 className="mt-4 text-[22px] font-extrabold tracking-[-0.6px] text-ink">
          Invite your first member.
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Your pod needs people. Without members, nobody gets the call.
        </p>

        <button
          type="button"
          onClick={handleWhatsApp}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] py-3.5 text-[15px] font-bold text-white transition-transform duration-150 hover:scale-[1.02] active:scale-[0.96]"
        >
          <WhatsAppIcon />
          Share on WhatsApp
        </button>

        <button
          type="button"
          onClick={handleCopy}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-surface py-3 text-sm font-semibold text-ink transition-colors duration-150 hover:bg-[#E5E5EA]"
        >
          {copied ? (
            <span className="text-[#1FA855]">Copied ✓</span>
          ) : (
            <>
              <Link2 className="size-4" />
              Copy pod link
            </>
          )}
        </button>

        <div className="my-5 flex items-center gap-3 text-[13px] text-ink-faint">
          <div className="h-px flex-1 bg-[#E5E5EA]" />
          or invite by email
          <div className="h-px flex-1 bg-[#E5E5EA]" />
        </div>

        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="friend@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleSendEmail} loading={sendingEmail} disabled={!email}>
            Send
          </Button>
        </div>
        {emailSentTo && (
          <p className="mt-2 text-sm text-[#1FA855]">Invite sent to {emailSentTo} ✓</p>
        )}

        {inviteSent && (
          <div className="mt-5 flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full border-2 border-dashed border-ink-faint" />
            <p className="text-sm text-ink-muted">Waiting for them to join...</p>
          </div>
        )}
      </div>

      {!showSkipWarning ? (
        <>
          <Button onClick={onNext} disabled={!inviteSent} size="lg" className="w-full">
            Continue →
          </Button>
          {!inviteSent && (
            <button
              type="button"
              onClick={() => setShowSkipWarning(true)}
              className="mt-3 text-center text-xs text-ink-faint underline-offset-2 hover:underline"
            >
              Skip for now
            </button>
          )}
        </>
      ) : (
        <div className="rounded-card border-[0.5px] border-[#E5E5EA] bg-surface p-4 text-center">
          <p className="text-sm text-ink-mid">
            Your pod will have no members. You can always invite later.
          </p>
          <div className="mt-3 flex gap-2">
            <Button variant="ghost" onClick={onNext} className="flex-1">
              Skip anyway
            </Button>
            <Button onClick={() => setShowSkipWarning(false)} className="flex-1">
              Add someone
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
