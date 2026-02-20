self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  if (type === 'SHOW_NOTIFICATION') {
    const { id, title, body } = payload;
    self.registration.showNotification(title, {
      body: body,
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="80" font-size="80">🔔</text></svg>',
      tag: id,
      vibrate: [200, 100, 200, 100, 200],
      requireInteraction: true,
      renotify: true,
      data: { id, body }
    });
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      if (list.length > 0) return list[0].focus();
      return self.clients.openWindow('./');
    })
  );
});
