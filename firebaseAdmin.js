import admin from "firebase-admin";

let db = null;
let auth = null;
let app = null;

function initAdmin() {
  if (app) return app;

  try {
    if (!admin.apps.length) {
      if (!process.env.FIREBASE_ADMIN_BASE64) {
        console.warn("⚠️ Firebase env vars missing — memory disabled");
        return null;
      }

      const decoded = JSON.parse(
        Buffer.from(process.env.FIREBASE_ADMIN_BASE64, "base64").toString()
      );

      app = admin.initializeApp({
        credential: admin.credential.cert(decoded),
      });
    } else {
      app = admin.app();
    }

    return app;
  } catch (err) {
    console.error("🔥 Firebase init failed:", err);
    return null;
  }
}

export function getDb() {
  if (db) return db;

  const appInstance = initAdmin();
  if (!appInstance) return null;

  db = admin.firestore();
  return db;
}

export function getAdminAuth() {
  if (auth) return auth;

  const appInstance = initAdmin();
  if (!appInstance) return null;

  auth = admin.auth();
  return auth;
}

export { admin };
