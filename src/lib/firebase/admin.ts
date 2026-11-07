import { createRestFirestoreDb } from "./firestoreRest";

export function isFirebaseAdminConfigured(): boolean {
  return true;
}

export function getFirebaseAdmin() {
  const db = createRestFirestoreDb();
  return { app: null, db, isConfigured: true };
}
