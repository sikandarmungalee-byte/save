// Firebase Cloud Messaging Service Worker for Savouré ERP
// Handles background push notifications on both Web and Mobile devices

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBFvaq1Hsftp77BNs_nHZs41rkPOYPt3aE",
  authDomain: "gen-lang-client-0112209964.firebaseapp.com",
  projectId: "gen-lang-client-0112209964",
  storageBucket: "gen-lang-client-0112209964.firebasestorage.app",
  messagingSenderId: "558916521027",
  appId: "1:558916521027:web:a6c82f08052cf2710618f6"
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Background Push Notification received:', payload);
    const notificationTitle = payload.notification?.title || payload.data?.title || '🔔 New Savouré Merchant Order';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || 'A new bakery order has been placed by a merchant.',
      icon: '/showcase/savoure-logo.png',
      badge: '/showcase/savoure-logo.png',
      tag: 'savoure-merchant-order',
      vibrate: [200, 100, 200, 100, 200],
      data: payload.data || {},
      actions: [
        { action: 'open_order', title: 'View Order' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (err) {
  console.warn('[firebase-messaging-sw.js] Service worker messaging init warning:', err);
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
