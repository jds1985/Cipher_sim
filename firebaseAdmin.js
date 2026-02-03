import admin from "firebase-admin";

let db = null;

export function getDb() {
  if (db) return db;

  try {
    if (!admin.apps.length) {
      if (!process.env.FIREBASE_ADMIN_BASE64) {
        console.warn("⚠️ Firebase env vars missing — memory disabled");
        return null;
      }

      const decoded = JSON.parse(
        Buffer.from(process.env.FIREBASE_ADMIN_BASE64, "base64").toString()
      );

      admin.initializeApp({
        credential: admin.credential.cert(decoded),
      });
    }

    db = admin.firestore();
    return db;
  } catch (err) {
    console.error("🔥 Firebase init failed:", err);
    return null;
  }
}
