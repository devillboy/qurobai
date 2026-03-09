// QurobAi Service Worker for Push Notifications

self.addEventListener("install", (event) => {
  console.log("[QurobAi SW] Installing...");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[QurobAi SW] Activated!");
  event.waitUntil(clients.claim());
});

self.addEventListener("push", (event) => {
  console.log("[QurobAi SW] Push received!");
  
  // Default notification data
  const defaultData = {
    title: "QurobAi",
    body: "You have a new notification",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    data: { url: "/chat" }
  };
  
  let notificationData = { ...defaultData };
  
  // Try to parse the push payload
  try {
    if (event.data) {
      // Try JSON parsing first
      try {
        const payload = event.data.json();
        console.log("[QurobAi SW] Parsed JSON payload:", payload);
        
        notificationData = {
          title: payload.title || defaultData.title,
          body: payload.body || payload.message || defaultData.body,
          icon: payload.icon || defaultData.icon,
          badge: payload.badge || defaultData.badge,
          data: payload.data || defaultData.data
        };
      } catch (jsonError) {
        // Try text parsing as fallback
        const text = event.data.text();
        console.log("[QurobAi SW] Raw text payload:", text);
        
        // Try parsing text as JSON
        try {
          const parsed = JSON.parse(text);
          notificationData = {
            title: parsed.title || defaultData.title,
            body: parsed.body || parsed.message || defaultData.body,
            icon: parsed.icon || defaultData.icon,
            badge: parsed.badge || defaultData.badge,
            data: parsed.data || defaultData.data
          };
        } catch (textJsonError) {
          // Use text as the body if it's meaningful
          if (text && text.length > 0 && text.length < 500) {
            notificationData.body = text;
          }
        }
      }
    }
  } catch (error) {
    console.error("[QurobAi SW] Error parsing push data:", error);
  }
  
  console.log("[QurobAi SW] Showing notification:", notificationData);
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      data: notificationData.data,
      vibrate: [100, 50, 100],
      requireInteraction: false,
      tag: "qurobai-notification-" + Date.now(),
      renotify: true
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  console.log("[QurobAi SW] Notification clicked");
  event.notification.close();
  
  const url = event.notification.data?.url || "/chat";
  
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Focus existing QurobAi tab if found
      for (const client of clientList) {
        if (client.url.includes("qurobai.lovable.app") && "focus" in client) {
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

// Handle background sync (optional enhancement)
self.addEventListener("sync", (event) => {
  console.log("[QurobAi SW] Background sync:", event.tag);
});
