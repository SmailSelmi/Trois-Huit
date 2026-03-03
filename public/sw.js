const CACHE_NAME = 'trois-huit-v5';
const PRE_CACHE = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        PRE_CACHE.map((url) => cache.add(url).catch((err) => {
          console.warn('[SW] Failed to cache:', url, err);
        }))
      );
    })
  );
  // Manual skip waiting via message from client
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Network-First for HTML and Manifest to avoid stale references to old chunks
  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname === '/manifest.json') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clonedResponse));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-First for everything else
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});

// ─── Web Push: handle incoming push — works even when app is closed ───────────
self.addEventListener('push', (event) => {
  // Default fallback data
  let title = 'Trois Huit | 3×8';
  let body  = 'لديك رسالة جديدة.';

  // Parse payload sent from the webhook
  if (event.data) {
    try {
      const parsed = event.data.json();
      if (parsed.title) title = parsed.title;
      if (parsed.body)  body  = parsed.body;
    } catch {
      body = event.data.text();
    }
  }

  const options = {
    // ── Content ──────────────────────────────────────────────────────────────
    body,
    // Truncate long messages cleanly (OS wraps at ~2 lines anyway)
    // ── Visuals ──────────────────────────────────────────────────────────────
    icon:  '/icons/icon-192x192.png',   // large icon shown in notification
    badge: '/icons/icon-192x192.png',   // small monochrome icon in status bar
    // ── Behaviour ────────────────────────────────────────────────────────────
    tag:              'trois-huit-broadcast',  // replaces previous unread notification
    renotify:         true,                    // always buzz even if replacing
    requireInteraction: false,                 // auto-dismiss after a few seconds
    silent:           false,                   // play default system sound
    vibrate:          [100, 50, 100],          // short double pulse
    // ── RTL / locale ─────────────────────────────────────────────────────────
    dir:  'rtl',
    lang: 'ar',
    // ── Tap action ───────────────────────────────────────────────────────────
    data: { url: '/' },
    // ── Quick actions ────────────────────────────────────────────────────────
    actions: [
      { action: 'open', title: 'فتح التطبيق' },
      { action: 'close', title: 'إغلاق' },
    ],
  };

  // waitUntil keeps the SW alive until showNotification resolves —
  // this guarantees delivery whether the app is open, in background, or closed.
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ─── Notification tap: focus the app or open it ───────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      // If a window is already open, focus it
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new tab
      return clients.openWindow(targetUrl);
    })
  );
});
