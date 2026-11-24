"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { OUTREACH_TEMPLATES, whatsappUrl } from "@/lib/whatsapp";

/**
 * Open a WhatsApp chat with someone, with a kind message already written. The admin reads it, can change it,
 * and presses send inside WhatsApp. Each opened chat is noted, so the next admin knows they were contacted.
 */
export function OutreachPanel({
  userId,
  name,
  phone,
  suggest,
}: {
  userId: string;
  name: string | null;
  phone: string | null;
  /** Which template to start on. */
  suggest?: string;
}) {
  const first = name?.trim().split(/\s+/)[0] ?? null;
  const [templateId, setTemplateId] = useState(OUTREACH_TEMPLATES.some((t) => t.id === suggest) ? suggest! : OUTREACH_TEMPLATES[0].id);
  const template = OUTREACH_TEMPLATES.find((t) => t.id === templateId)!;
  const [edited, setEdited] = useState<string | null>(null);
  const [opened, setOpened] = useState(false);

  const text = edited ?? template.text(first);
  const url = whatsappUrl(phone, text);

  function pick(id: string) {
    setTemplateId(id);
    setEdited(null);
    setOpened(false);
  }

  function open() {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
    setOpened(true);
    void fetch("/api/admin/outreach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, template: edited === null ? templateId : "custom" }),
    }).catch(() => {});
  }

  if (!phone) {
    return <p className="text-body-sm text-ink-muted">No phone number on this account, so there is no WhatsApp chat to open. Try their email instead.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="block">
        <span className="text-caption font-bold text-ink-mid">What is it for?</span>
        <select
          value={templateId}
          onChange={(e) => pick(e.target.value)}
          className="mt-1 min-h-11 w-full rounded-2xl border-[0.5px] border-hairline bg-card px-3 text-body-sm text-ink"
        >
          {OUTREACH_TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label} ({t.when})
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-caption font-bold text-ink-mid">Message (you can change it before sending)</span>
        <textarea
          value={text}
          onChange={(e) => setEdited(e.target.value)}
          rows={6}
          className="mt-1 w-full rounded-2xl border-[0.5px] border-hairline bg-card p-3 text-body-sm leading-relaxed text-ink"
        />
      </label>

      <button
        type="button"
        onClick={open}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#1FA855] px-5 text-body-sm font-bold text-white transition-transform active:scale-[0.98]"
      >
        <MessageCircle className="size-4" aria-hidden="true" /> Open WhatsApp chat
      </button>
      {opened && <p className="text-caption text-ink-muted">Opened. Press send in WhatsApp. We noted that you reached out.</p>}
    </div>
  );
}
