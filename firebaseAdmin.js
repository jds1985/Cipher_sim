import * as admin from "firebase-admin";

let app;

if (!admin.apps.length) {
  try {
    const decoded = Buffer.from(
      process.env.FIREBASE_ADMIN_BASE64,
      "base64"
    ).toString("utf8");

    const serviceAccount = JSON.parse(decoded);

    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (err) {
    console.error("🔥 Firebase Admin initialization error:", err);
  }
} else {
  app = admin.app();
}

export const db = admin.firestore();
