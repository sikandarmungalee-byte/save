import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

// Reads from environment variables if present (VITE_FIREBASE_*), with safe fallback
const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0112209964",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:558916521027:web:a6c82f08052cf2710618f6",
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBFvaq1Hsftp77BNs_nHZs41rkPOYPt3aE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "gen-lang-client-0112209964.firebaseapp.com",
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || "ai-studio-apexerpenterpris-67d5d43f-3a5e-4c77-855a-ea478fbbd101",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "gen-lang-client-0112209964.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "558916521027",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Connect to the specific firestore database provisioned for this applet
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Connection test
export async function testFirebaseConnection() {
  try {
    await getDocFromServer(doc(db, 'users', 'status_check'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network restricted.');
    }
    return false;
  }
}
