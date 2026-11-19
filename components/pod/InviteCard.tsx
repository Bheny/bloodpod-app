"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, Link2 } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.555 4.114 1.524 5.84L0 24l6.32-1.488A11.93 11.93 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0Zm0 21.818a9.78 9.78 0 0 1-5.013-1.378l-.36-.214-3.75.883.901-3.65-.234-.374A9.79 9.79 0 1 1 21.818 12 9.79 9.79 0 0 1 12 21.818Zm5.37-7.337c-.295-.148-1.747-.862-2.018-.96-.27-.099-.467-.148-.664.148-.197.295-.762.96-.935 1.157-.172.197-.345.222-.64.074-.295-.148-1.244-.459-2.37-1.464-.876-.78-1.467-1.745-1.64-2.04-.172-.296-.018-.456.13-.604.148-.148.33-.385.494-.578.165-.193.22-.33.33-.55.11-.222.055-.413-.043-.578-.099-.165-.886-2.135-1.214-2.917-.32-.769-.646-.665-.886-.677l-.756-.014c-.247 0-.65.092-.886.413-.235.32-.9.881-.9 2.148s.926 2.493 1.055 2.665c.13.172 1.79 2.732 4.34 3.724 2.55.992 2.55.661 3.012.62.461-.04 1.502-.605 1.715-1.19.213-.585.213-1.087.148-1.19-.065-.104-.197-.165-.493-.313Z" />
    </svg>
  );
}

// The Pod's durable invite link and code, shared in one tap.
export function InviteCard({
  podName,
  inviteUrl,
  inviteCode,
  full,
  moreHref = "/pod/invite",
}: {
  podName: string;
  inviteUrl: string;
  inviteCode: string;
  full: boolean;
  /** The full invite page for this Pod. */
  moreHref?: string;
}) {
  const [copied, setCopied] = useState<"link" | "code" | null>(null);

  async function copy(kind: "link" | "code", text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      // clipboard can be blocked; the text is visible to copy by hand
    }
  }

  if (full) {
    return (
      <Card>
        <CardTitle>Invite people</CardTitle>
        <p className="mt-2 text-caption text-ink-muted lg:text-body-sm">
          This Pod is full. Free Pods hold up to 20 members.
        </p>
      </Card>
    );
  }

  const text = encodeURIComponent(
    `I'd like you in my BloodPod circle, "${podName}". It's free and takes two minutes. Join here: ${inviteUrl} (code ${inviteCode})`,
  );

  return (
    <Card>
      <CardTitle
        aside={
          <Link href={moreHref} className="text-caption font-bold text-ink-mid hover:text-ink">
            More options
          </Link>
        }
      >
        Invite people
      </CardTitle>

      <a
        href={`https://wa.me/?text=${text}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex items-center justify-center gap-2 rounded-full bg-[#25D366] py-3 text-body-sm font-bold text-white transition-transform active:scale-95"
      >
        <WhatsAppIcon /> Share on WhatsApp
      </a>

      <button
        type="button"
        onClick={() => copy("link", inviteUrl)}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-surface py-3 text-body-sm font-semibold text-ink transition-colors hover:bg-hairline"
      >
        {copied === "link" ? (
          <>
            <Check className="size-4 text-[#1FA855]" /> Link copied
          </>
        ) : (
          <>
            <Link2 className="size-4" /> Copy invite link
          </>
        )}
      </button>

      <div className="mt-4 flex items-center justify-between rounded-xl bg-surface px-4 py-3">
        <div>
          <p className="text-caption text-ink-muted">Or share the code</p>
          <p className="text-title font-extrabold tracking-[0.2em] text-ink">{inviteCode}</p>
        </div>
        <button
          type="button"
          onClick={() => copy("code", inviteCode)}
          aria-label="Copy invite code"
          className="flex size-9 items-center justify-center rounded-full bg-white text-ink-mid shadow-raised transition-transform active:scale-90"
        >
          {copied === "code" ? <Check className="size-4 text-[#1FA855]" /> : <Copy className="size-4" />}
        </button>
      </div>
    </Card>
  );
}
