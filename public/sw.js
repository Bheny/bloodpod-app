// BloodPod service worker: web push + notification handling.
// Offline Blood Card caching is added in a later step.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "BloodPod", body: event.data.text() };
  }

  const critical = data.critical === true;
  event.waitUntil(
    self.registration.showNotification(data.title || "BloodPod", {
      body: data.body,
      icon: "/pwa-icon/192",
      badge: "/pwa-icon/192",
      tag: data.tag, // same emergency => one notification, not one per Pod
      renotify: Boolean(data.tag),
      requireInteraction: critical,
      vibrate: critical ? [300, 100, 300, 100, 300] : [100, 50, 100],
      data: { url: data.url || "/dashboard" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/dashboard", self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if ("focus" in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
