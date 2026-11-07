/**
 * VISROSLOT Background Push & Alarm Service Worker
 * Enables loud audio chime, vibration alerts, and lock-screen notifications
 * even when the phone screen is OFF and website is CLOSED.
 */

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming Web Push Notifications from server
self.addEventListener("push", (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: "🔔 New Booking Alert!",
        body: event.data.text() || "New customer appointment received.",
      };
    }
  }

  const title = data.title || "🔔 New Booking Confirmed!";
  const options = {
    body: data.body || "New customer appointment received on VISROSLOT.",
    icon: "/assets/visroslot-logo.png",
    badge: "/assets/visroslot-logo.png",
    // Pulsing high-urgency vibration pattern: vibrates phone on lockscreen
    vibrate: [500, 200, 500, 200, 500, 200, 1000],
    sound: "/sounds/booking-chime.wav",
    tag: data.tag || `visro-booking-${Date.now()}`,
    renotify: true,
    requireInteraction: true, // Remains on lockscreen until dismissed or viewed
    data: {
      url: data.url || "/app/overview",
      appointmentId: data.appointmentId || null,
      timestamp: Date.now(),
    },
    actions: [
      { action: "open", title: "View Booking" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification tap / click from lockscreen or notification tray
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") {
    return;
  }

  const targetUrl =
    (event.notification.data && event.notification.data.url) || "/app/overview";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // If an existing VISROSLOT tab is open, focus it
        for (const client of clientList) {
          if (client.url.includes("/app") && "focus" in client) {
            return client.focus();
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// Handle inter-tab message events (e.g. Test Loud Alarm trigger)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "TRIGGER_NOTIFICATION") {
    const { title, body, url } = event.data;
    self.registration.showNotification(title || "🔔 VISROSLOT Alarm Test", {
      body: body || "Your phone and alarm sound system are working properly!",
      icon: "/assets/visroslot-logo.png",
      badge: "/assets/visroslot-logo.png",
      vibrate: [500, 200, 500, 200, 500, 200, 1000],
      sound: "/sounds/booking-chime.wav",
      tag: `visro-test-${Date.now()}`,
      renotify: true,
      requireInteraction: true,
      data: { url: url || "/app/overview" },
      actions: [{ action: "open", title: "Open Dashboard" }],
    });
  }
});
