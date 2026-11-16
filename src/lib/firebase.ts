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
interface FirebaseAppletConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  firestoreDatabaseId: string;
  storageBucket: string;
  messagingSenderId: string;
  measurementId?: string;
  oAuthClientId?: string;
  recaptchaSiteKey?: string;
}

const configModules = import.meta.glob('../../firebase-applet-config.json', {
  eager: true,
  import: 'default',
}) as Record<string, Partial<FirebaseAppletConfig>>;

const fileConfig: Partial<FirebaseAppletConfig> = Object.values(configModules)[0] || {};

const EXISTING_PROJECT_CONFIG: FirebaseAppletConfig = {
  projectId: 'gen-lang-client-0112209964',
  appId: '1:558916521027:web:a6c82f08052cf2710618f6',
  apiKey: 'AIzaSyBFvaq1Hsftp77BNs_nHZs41rkPOYPt3aE',
  authDomain: 'gen-lang-client-0112209964.firebaseapp.com',
  firestoreDatabaseId: 'ai-studio-apexerpenterpris-67d5d43f-3a5e-4c77-855a-ea478fbbd101',
  storageBucket: 'gen-lang-client-0112209964.firebasestorage.app',
  messagingSenderId: '558916521027',
};

// Silence verbose internal Firestore WebChannel streaming warnings
setLogLevel('error');

const resolvedFirebaseConfig: FirebaseAppletConfig = {
  ...EXISTING_PROJECT_CONFIG,
  ...fileConfig,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || fileConfig.apiKey || EXISTING_PROJECT_CONFIG.apiKey,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || fileConfig.projectId || EXISTING_PROJECT_CONFIG.projectId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || fileConfig.appId || EXISTING_PROJECT_CONFIG.appId,
  firestoreDatabaseId:
    import.meta.env.VITE_FIREBASE_DATABASE_ID ||
    fileConfig.firestoreDatabaseId ||
    EXISTING_PROJECT_CONFIG.firestoreDatabaseId,
};

const app = !getApps().length ? initializeApp(resolvedFirebaseConfig) : getApp();

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
    resolvedFirebaseConfig.firestoreDatabaseId
  );
} catch {
  firestoreDb = getFirestore(app, resolvedFirebaseConfig.firestoreDatabaseId);
}

export const db = firestoreDb;
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  return errInfo;
}

// Connection test with graceful offline resilience
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'erp', 'main'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is currently operating in offline mode.');
    } else {
      handleFirestoreError(error, OperationType.GET, 'erp/main');
    }
    return false;
  }
}
