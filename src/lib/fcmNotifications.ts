import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { getApps, initializeApp, getApp } from 'firebase/app';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { MerchantOrder } from '../types/erp';

// Safe Audio Chime Synthesizer using Web Audio API
export function playOrderNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    // Tone 1: High cheerful chime
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    gain1.gain.setValueAtTime(0.3, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.35);

    // Tone 2: Harmonious bell tone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
    gain2.gain.setValueAtTime(0.35, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.65);
  } catch (err) {
    console.warn('Audio chime notice:', err);
  }
}

// Trigger Mobile Device Vibration
export function triggerMobileVibration() {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      // Distinct pattern: buzz-pause-buzz-pause-buzz
      navigator.vibrate([200, 100, 200, 100, 300]);
    }
  } catch (e) {}
}

let fcmTokenCached: string | null = null;
let messagingInstance: any = null;

// Initialize Firebase Cloud Messaging & Service Worker
export async function initFCM(onForegroundMessage?: (payload: any) => void): Promise<{
  supported: boolean;
  permission: NotificationPermission;
  token: string | null;
}> {
  if (typeof window === 'undefined') {
    return { supported: false, permission: 'default', token: null };
  }

  const supported = await isSupported().catch(() => false);
  if (!supported) {
    console.info('[FCM] Firebase Cloud Messaging not supported in this browser environment.');
    return {
      supported: false,
      permission: typeof Notification !== 'undefined' ? Notification.permission : 'default',
      token: null,
    };
  }

  try {
    const app = getApps().length > 0 ? getApp() : initializeApp({
      apiKey: "AIzaSyBFvaq1Hsftp77BNs_nHZs41rkPOYPt3aE",
      projectId: "gen-lang-client-0112209964",
      messagingSenderId: "558916521027",
      appId: "1:558916521027:web:a6c82f08052cf2710618f6",
    });

    messagingInstance = getMessaging(app);

    // Register Service Worker for Mobile & Web Background Notifications
    let swRegistration: ServiceWorkerRegistration | undefined;
    if ('serviceWorker' in navigator) {
      try {
        swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/',
        });
        console.log('[FCM] Service Worker registered successfully for push notifications.');
      } catch (swErr) {
        console.warn('[FCM] Service worker registration notice:', swErr);
      }
    }

    // Set up foreground message listener
    if (messagingInstance) {
      onMessage(messagingInstance, (payload) => {
        console.log('[FCM] Foreground push notification received:', payload);
        playOrderNotificationChime();
        triggerMobileVibration();

        // Also display native notification if permission is granted
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          const title = payload.notification?.title || payload.data?.title || '🔔 New Merchant Order';
          const options: NotificationOptions = {
            body: payload.notification?.body || payload.data?.body || 'A new bakery order has arrived.',
            icon: '/showcase/savoure-logo.png',
            badge: '/showcase/savoure-logo.png',
            tag: 'savoure-order-incoming',
          };
          try {
            new Notification(title, options);
          } catch (e) {
            swRegistration?.showNotification(title, options);
          }
        }

        if (onForegroundMessage) {
          onForegroundMessage(payload);
        }

        // Dispatch window event for UI banners
        window.dispatchEvent(
          new CustomEvent('savoure_fcm_notification', { detail: payload })
        );
      });
    }

    const currentPerm = typeof Notification !== 'undefined' ? Notification.permission : 'default';
    return { supported: true, permission: currentPerm, token: fcmTokenCached };
  } catch (err) {
    console.warn('[FCM] Init notice:', err);
    return {
      supported: false,
      permission: typeof Notification !== 'undefined' ? Notification.permission : 'default',
      token: null,
    };
  }
}

// Request Push Notification Permission on Mobile and Desktop
export async function requestPushNotificationPermission(userId?: string): Promise<{
  granted: boolean;
  token: string | null;
  error?: string;
}> {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return { granted: false, token: null, error: 'Notifications not supported on this device' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { granted: false, token: null, error: 'Notification permission was denied' };
    }

    // Attempt to retrieve FCM Token
    let token: string | null = null;
    if (messagingInstance) {
      try {
        let swReg: ServiceWorkerRegistration | undefined;
        if ('serviceWorker' in navigator) {
          swReg = await navigator.serviceWorker.ready;
        }

        token = await getToken(messagingInstance, {
          serviceWorkerRegistration: swReg,
        });

        if (token) {
          fcmTokenCached = token;
          console.log('[FCM] Device Token acquired successfully:', token.slice(0, 15) + '...');

          // Persist token in Firestore for device targeting
          const deviceId = 'dev_' + (userId || 'admin') + '_' + (navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop');
          await setDoc(doc(db, 'fcm_tokens', deviceId), {
            token,
            userId: userId || 'admin',
            device: navigator.userAgent,
            isMobile: /Android|iPhone|iPad|iPod/i.test(navigator.userAgent),
            updatedAt: new Date().toISOString(),
          }, { merge: true }).catch((e) => console.warn('Token sync notice:', e));

          // Also register on backend server
          fetch('/api/fcm/register-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, userId, isMobile: /Android|iPhone|iPad/i.test(navigator.userAgent) }),
          }).catch(() => {});
        }
      } catch (tokenErr: any) {
        console.warn('[FCM] Token acquisition notice (fallback to Web Notification):', tokenErr?.message);
      }
    }

    return { granted: true, token };
  } catch (err: any) {
    return { granted: false, token: null, error: err?.message || 'Failed to request notification permission' };
  }
}

// Unified Order Notification Dispatcher (FCM + Web Push + Audio Chime + Mobile Vibration + Server Push)
export async function dispatchOrderPushNotification(order: MerchantOrder): Promise<void> {
  // 1. Play audible chime for immediate attention
  playOrderNotificationChime();

  // 2. Trigger phone haptic vibration for mobile devices
  triggerMobileVibration();

  // 3. Format notification message
  const title = `🔔 New Order: ${order.orderNumber}`;
  const body = `${order.merchantStoreName || order.merchantName} placed an order for R${order.total.toFixed(2)} (${order.items.length} items).`;

  // 4. Dispatch browser Web Notification (if permission is granted)
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification(title, {
          body,
          icon: '/showcase/savoure-logo.png',
          badge: '/showcase/savoure-logo.png',
          tag: `order-${order.id}`,
          data: { orderId: order.id, orderNumber: order.orderNumber },
        });
      } else {
        new Notification(title, {
          body,
          icon: '/showcase/savoure-logo.png',
          badge: '/showcase/savoure-logo.png',
          tag: `order-${order.id}`,
        });
      }
    } catch (notifErr) {
      console.warn('Browser notification notice:', notifErr);
    }
  }

  // 5. Broadcast in-app custom event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('savoure_merchant_order_placed', { detail: order })
    );
  }

  // 6. Notify server backend for push fan-out to all connected phones & laptops
  try {
    await fetch('/api/fcm/send-order-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: order.id,
        orderNumber: order.orderNumber,
        merchantName: order.merchantStoreName || order.merchantName,
        total: order.total,
        itemsCount: order.items.length,
        branch: order.branch,
        title,
        body,
      }),
    });
  } catch (e) {
    console.warn('Server order notification dispatch notice:', e);
  }
}
