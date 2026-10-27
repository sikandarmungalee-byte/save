import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

function sanitizeConfig(val: any, fallback: string): string {
  if (!val || typeof val !== 'string' || val.trim() === '' || val === '5555' || val === 'YOUR_FIREBASE_API_KEY' || val === 'YOUR_APP_ID') {
    return fallback;
  }
  return val.trim();
}

function getEnv(key: string, fallback: string): string {
  let val: any = undefined;
  try {
    // Vite client-side
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta && import.meta.env) {
      // @ts-ignore
      val = import.meta.env[key];
    }
  } catch (e) {}

  if (!val) {
    try {
      // Node.js server-side
      if (typeof process !== 'undefined' && process && process.env) {
        val = process.env[key];
      }
    } catch (e) {}
  }

  return sanitizeConfig(val, fallback);
}

// Built-in production cloud configuration with environment override support
const firebaseConfig = {
  projectId: getEnv("VITE_FIREBASE_PROJECT_ID", "gen-lang-client-0112209964"),
  appId: getEnv("VITE_FIREBASE_APP_ID", "1:558916521027:web:a6c82f08052cf2710618f6"),
  apiKey: getEnv("VITE_FIREBASE_API_KEY", "AIzaSyBFvaq1Hsftp77BNs_nHZs41rkPOYPt3aE"),
  authDomain: getEnv("VITE_FIREBASE_AUTH_DOMAIN", "gen-lang-client-0112209964.firebaseapp.com"),
  firestoreDatabaseId: getEnv("VITE_FIREBASE_DATABASE_ID", "ai-studio-apexerpenterpris-67d5d43f-3a5e-4c77-855a-ea478fbbd101"),
  storageBucket: getEnv("VITE_FIREBASE_STORAGE_BUCKET", "gen-lang-client-0112209964.firebasestorage.app"),
  messagingSenderId: getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID", "558916521027"),
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Connect to the specific firestore database provisioned for this applet
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Connection test
export async function testFirebaseConnection() {
  try {
    await getDocFromServer(doc(db, 'erp', 'main'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network restricted.');
    }
    return false;
  }
}
