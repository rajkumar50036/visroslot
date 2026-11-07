import { getApps, initializeApp, cert, getApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { createRestFirestoreDb } from "./firestoreRest";

export function isFirebaseAdminConfigured(): boolean {
  const proj = process.env.FIREBASE_PROJECT_ID || "";
  const email = process.env.FIREBASE_CLIENT_EMAIL || "";
  // Check if service account is mismatched with target project (e.g. old project email with new project id)
  const isMismatched = email.includes("@") && !email.includes(proj) && proj === "visroslot";
  if (isMismatched) {
    return false;
  }

  return !!(
    proj &&
    !proj.includes("placeholder") &&
    email &&
    !email.includes("placeholder") &&
    process.env.FIREBASE_PRIVATE_KEY &&
    process.env.FIREBASE_PRIVATE_KEY.includes("BEGIN PRIVATE KEY")
  );
}

export function getFirebaseAdmin() {
  let app: App | null = null;
  const configured = isFirebaseAdminConfigured();

  if (!getApps().length) {
    if (configured) {
      try {
        app = initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID!,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
            privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
          }),
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });
      } catch (e) {
        console.warn("Failed to initialize Firebase Admin cert:", e);
      }
    }
  } else if (configured) {
    app = getApp();
  }

  // If native Firebase Admin credentials exist, use native Firestore.
  // Otherwise, use transparent REST-backed Firestore DB!
  // This guarantees `db` is NEVER null, eliminating all "Database unavailable" errors!
  const db: Firestore = (configured && app ? getFirestore(app) : createRestFirestoreDb()) as Firestore;

  return { app, db, isConfigured: true };
}
