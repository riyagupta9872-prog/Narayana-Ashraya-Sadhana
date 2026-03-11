const CACHE_NAME = 'sadhana-tracker-v1';
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './banner.png',
  'https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore-compat.js',
  'https://www.gstatic.com/firebasejs/9.22.2/firebase-messaging-compat.js',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js',
];

// Install — cache core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activate — delete old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — network first, cache fallback
self.addEventListener('fetch', e => {
  // Skip Firebase/Firestore API calls — always network
  if (e.request.url.includes('firestore.googleapis.com') ||
      e.request.url.includes('identitytoolkit') ||
      e.request.url.includes('securetoken') ||
      e.request.url.includes('firebase') && e.request.url.includes('googleapis')) {
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Cache successful GET responses
        if (e.request.method === 'GET' && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// Push notifications
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : { title: '🙏 Sadhana Tracker', body: 'Time to fill your Sadhana!' };
  e.waitUntil(
    self.registration.showNotification(data.title || '🙏 Sadhana Tracker', {
      body: data.body || '',
      icon: './icon-192.png',
      badge: './icon-192.png',
      vibrate: [200, 100, 200],
      data: { url: './' }
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data?.url || './'));
});
