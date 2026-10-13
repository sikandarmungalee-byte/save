import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

function sanitizeConfig(val: any, fallback: string): string {
  if (!val || typeof val !== 'string' || val.trim() === '' || val === '5555' || val === 'YOUR_FIREBASE_API_KEY' || val === 'YOUR_APP_ID') {
    return fallback;
  }
  return val.trim();
}

// Built-in production cloud configuration with environment override support
const firebaseConfig = {
  projectId: sanitizeConfig(import.meta.env.VITE_FIREBASE_PROJECT_ID, "gen-lang-client-0112209964"),
  appId: sanitizeConfig(import.meta.env.VITE_FIREBASE_APP_ID, "1:558916521027:web:a6c82f08052cf2710618f6"),
  apiKey: sanitizeConfig(import.meta.env.VITE_FIREBASE_API_KEY, "AIzaSyBFvaq1Hsftp77BNs_nHZs41rkPOYPt3aE"),
  authDomain: sanitizeConfig(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, "gen-lang-client-0112209964.firebaseapp.com"),
  firestoreDatabaseId: sanitizeConfig(import.meta.env.VITE_FIREBASE_DATABASE_ID, "ai-studio-apexerpenterpris-67d5d43f-3a5e-4c77-855a-ea478fbbd101"),
  storageBucket: sanitizeConfig(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, "gen-lang-client-0112209964.firebasestorage.app"),
  messagingSenderId: sanitizeConfig(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, "558916521027"),
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
