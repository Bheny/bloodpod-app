import webpush from "web-push";
import { prisma } from "@/lib/prisma";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  /** Same tag replaces an earlier notification: one per emergency. */
  tag?: string;
  critical?: boolean;
};

let configured = false;
function configure() {
  if (configured) return;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) throw new Error("VAPID keys are not configured");
  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:hello@bloodpod.app", pub, priv);
  configured = true;
}

/** Sends to every device the user has subscribed; prunes dead subscriptions. */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  configure();
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  const body = JSON.stringify(payload);
  let sent = 0;

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
          { TTL: payload.critical ? 3600 : 86400, urgency: payload.critical ? "high" : "normal" },
        );
        sent++;
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
        } else {
          console.error("Push send failed", status);
        }
      }
    }),
  );

  return { sent, devices: subs.length };
}
