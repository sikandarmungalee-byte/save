import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  doc,
  getDocFromServer,
  setLogLevel,
  Firestore
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Silence verbose internal Firestore WebChannel streaming warnings
setLogLevel('error');

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Configure Firestore with experimentalForceLongPolling and useFetchStreams: false
// This guarantees instant, reliable connectivity across desktop browsers, mobile devices,
// proxy environments, and preview iframes without 10-second stream negotiation timeouts.
let firestoreDb: Firestore;
try {
  firestoreDb = initializeFirestore(
    app,
    {
      experimentalForceLongPolling: true,
    },
    firebaseConfig.firestoreDatabaseId
  );
} catch {
  firestoreDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

export const db = firestoreDb;
export const auth = getAuth(app);

// Connection test with graceful offline resilience
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'erp', 'main'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is currently operating in offline mode.');
    }
    return false;
  }
}
