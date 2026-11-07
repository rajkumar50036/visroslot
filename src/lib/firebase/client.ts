import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  type Auth,
  type User,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getAnalytics, type Analytics, isSupported } from "firebase/analytics";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDi1cHQO9OIuPJlr2qdERVJOjtp8sTv75c",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "visroslot.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "visroslot",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "visroslot.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "895677315501",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:895677315501:web:eb54fc3c74f8ed97324924",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-4JPZW7PRSQ",
};

export function isFirebaseConfigured(): boolean {
  return !!(
    firebaseConfig.apiKey &&
    !firebaseConfig.apiKey.includes("placeholder") &&
    firebaseConfig.projectId &&
    !firebaseConfig.projectId.includes("placeholder")
  );
}

let app: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let dbInstance: Firestore | undefined;
let storageInstance: FirebaseStorage | undefined;
let analyticsInstance: Analytics | undefined;

export function getFirebaseClient() {
  if (!isFirebaseConfigured()) {
    return {
      app: null,
      auth: null,
      db: null,
      storage: null,
      analytics: null,
      isConfigured: false,
    };
  }

  if (!app) {
    try {
      app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      authInstance = getAuth(app);
      if (typeof window !== "undefined") {
        setPersistence(authInstance, browserLocalPersistence).catch((err) => {
          console.warn("Firebase local persistence setup:", err);
        });

        // Initialize Firebase Analytics in supported browser environments
        isSupported()
          .then((supported) => {
            if (supported && app && !analyticsInstance) {
              try {
                analyticsInstance = getAnalytics(app);
              } catch (err) {
                console.warn("Firebase Analytics initialization warning:", err);
              }
            }
          })
          .catch(() => {});
      }
      dbInstance = getFirestore(app);
      storageInstance = getStorage(app);
    } catch (err) {
      console.error("Firebase client initialization error:", err);
      return {
        app: null,
        auth: null,
        db: null,
        storage: null,
        analytics: null,
        isConfigured: false,
      };
    }
  }

  return {
    app,
    auth: authInstance,
    db: dbInstance,
    storage: storageInstance,
    analytics: analyticsInstance,
    isConfigured: true,
  };
}

// Convenient direct exported instances
export const getAuthClient = () => getFirebaseClient().auth;
export const getDbClient = () => getFirebaseClient().db;
export const getStorageClient = () => getFirebaseClient().storage;

// Direct exported auth instance (accessible across client modules)
export const auth = typeof window !== "undefined" ? getFirebaseClient().auth : undefined;
export const db = typeof window !== "undefined" ? getFirebaseClient().db : undefined;
export const storage = typeof window !== "undefined" ? getFirebaseClient().storage : undefined;

// Re-export common Firebase Auth helpers
export { GoogleAuthProvider, signInWithPopup };

/**
 * Standard Google Sign-In helper function
 * Opens the Google Sign-In popup using the configured Firebase Auth instance
 */
export const signInWithGoogle = async (): Promise<User | null> => {
  const { auth: currentAuth } = getFirebaseClient();
  if (!currentAuth) {
    throw new Error("Firebase Authentication is not configured.");
  }

  // 1. Create an instance of the Google provider object
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  try {
    // 2. Open the Google Sign-In pop-up
    const result = await signInWithPopup(currentAuth, provider);

    // 3. Retrieve the authenticated user
    const user = result.user;
    console.log("Logged in successfully:", user.displayName || user.email);
    return user;
  } catch (error: any) {
    console.error("Google Sign-In Error:", error.message);
    throw error;
  }
};
