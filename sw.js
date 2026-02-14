const CACHE_NAME = 'reminder-app-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// ========== ポーリングで通知チェック ==========
// Service Worker 側でも定期チェック（メインスレッドが停止した場合の保険）
let checkInterval = null;

function startPolling() {
  if (checkInterval) return;
  checkInterval = setInterval(() => {
    checkAndFireReminders();
  }, 15000); // 15秒ごとにチェック
}

async function checkAndFireReminders() {
  try {
    // メインスレッドにチェック要求を送る
    const clients_list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients_list) {
      client.postMessage({ type: 'CHECK_REMINDERS' });
    }
  } catch (e) {
    // クライアントがいない場合は無視
  }
}

self.addEventListener('message', (event) => {
  const { type, payload } = event.data;

  if (type === 'START_POLLING') {
    startPolling();
  }

  if (type === 'SHOW_NOTIFICATION') {
    const { id, title, body } = payload;
    self.registration.showNotification(title, {
      body: body,
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="80" font-size="80">🔔</text></svg>',
      tag: id,
      vibrate: [200, 100, 200],
      requireInteraction: true,
      data: { id, body }
    });
  }

  if (type === 'KEEP_ALIVE') {
    // SWを起こし続ける
    startPolling();
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return self.clients.openWindow('/');
    })
  );
});
