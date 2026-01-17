// firebaseAdmin.js
import admin from "firebase-admin";

let db = null;

export function getDb() {
  if (db) return db;

  try {
    if (!admin.apps.length) {
      if (
        !process.env.FIREBASE_PROJECT_ID ||
        !process.env.FIREBASE_CLIENT_EMAIL ||
        !process.env.FIREBASE_PRIVATE_KEY
      ) {
        console.warn("⚠️ Firebase env vars missing — memory disabled");
        return null;
      }

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
      });
    }

    db = admin.firestore();
    return db;
  } catch (err) {
    console.error("🔥 Firebase init failed:", err);
    return null; // FAIL OPEN
  }
}
