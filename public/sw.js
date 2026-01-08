// QurobAi Service Worker for Push Notifications

self.addEventListener("install", (event) => {
  console.log("QurobAi Service Worker installed");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("QurobAi Service Worker activated");
  event.waitUntil(clients.claim());
});

self.addEventListener("push", (event) => {
  console.log("Push notification received");
  
  let data = {
    title: "QurobAi",
    body: "You have a new notification",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    data: { url: "/" }
  };
  
  try {
    if (event.data) {
      const payload = event.data.json();
      data = {
        title: payload.title || data.title,
        body: payload.body || data.body,
        icon: payload.icon || data.icon,
        badge: payload.badge || data.badge,
        data: payload.data || data.data
      };
    }
  } catch (e) {
    console.error("Error parsing push data:", e);
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      data: data.data,
      vibrate: [100, 50, 100],
      requireInteraction: false
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked");
  event.notification.close();
  
  const url = event.notification.data?.url || "/";
  
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If a window tab matching the URL already exists, focus it
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
