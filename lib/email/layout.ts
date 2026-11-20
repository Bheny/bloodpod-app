import { appUrl } from "@/lib/email/send";

export function esc(value: string | number | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface EmailContent {
  subject: string;
  /** The grey line mail apps show after the subject. */
  preheader: string;
  heading: string;
  /** Plain paragraphs. Escaped for you. */
  paragraphs: string[];
  /** Small label/value rows, like the details of a booking. */
  facts?: { label: string; value: string }[];
  cta?: { label: string; url: string };
  /** Smaller grey text under the button. */
  footnote?: string;
  /** Use the strong red banner, for emergencies. */
  urgent?: boolean;
}

const RED = "#DD0000";
const INK = "#1d1d1f";
const MUTED = "#6e6e73";

/** Email clients ignore most CSS, so this is inline-styled tables and nothing clever. */
export function render(c: EmailContent): { subject: string; html: string; text: string } {
  const facts = c.facts?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border:1px solid #ececf0;border-radius:12px;">${c.facts
        .map(
          (f, i) =>
            `<tr><td style="padding:11px 16px;font-size:13px;color:${MUTED};${i ? "border-top:1px solid #ececf0;" : ""}">${esc(f.label)}</td><td align="right" style="padding:11px 16px;font-size:14px;font-weight:600;color:${INK};${i ? "border-top:1px solid #ececf0;" : ""}">${esc(f.value)}</td></tr>`,
        )
        .join("")}</table>`
    : "";

  const cta = c.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;"><tr><td style="background:${RED};border-radius:999px;"><a href="${esc(c.cta.url)}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">${esc(c.cta.label)}</a></td></tr></table>`
    : "";

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(c.subject)}</title></head>
<body style="margin:0;padding:0;background:#f5f5f7;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(c.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<tr><td style="padding:0 4px 14px;font-size:18px;font-weight:800;letter-spacing:-0.3px;color:${RED};">BloodPod</td></tr>
<tr><td style="background:#ffffff;border-radius:20px;overflow:hidden;">
${c.urgent ? `<div style="background:${RED};height:6px;line-height:6px;font-size:0;">&nbsp;</div>` : ""}
<div style="padding:28px 26px 26px;">
<h1 style="margin:0 0 14px;font-size:24px;line-height:1.2;letter-spacing:-0.5px;color:${INK};">${esc(c.heading)}</h1>
${c.paragraphs.map((p) => `<p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:#3a3a3c;">${esc(p)}</p>`).join("")}
${facts}${cta}
${c.footnote ? `<p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:${MUTED};">${esc(c.footnote)}</p>` : ""}
</div></td></tr>
<tr><td style="padding:16px 8px;font-size:12px;line-height:1.5;color:${MUTED};text-align:center;">You get this because of your BloodPod account.<br>BloodPod · Ghana · <a href="${esc(appUrl("/"))}" style="color:${MUTED};">bloodpod</a></td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    c.heading,
    "",
    ...c.paragraphs,
    ...(c.facts?.length ? ["", ...c.facts.map((f) => `${f.label}: ${f.value}`)] : []),
    ...(c.cta ? ["", `${c.cta.label}: ${c.cta.url}`] : []),
    ...(c.footnote ? ["", c.footnote] : []),
    "",
    "BloodPod",
  ].join("\n");

  return { subject: c.subject, html, text };
}
