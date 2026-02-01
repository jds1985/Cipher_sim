// pages/api/db.js
import admin from "firebase-admin";

if (!admin.apps.length) {
  const base64 = process.env.FIREBASE_ADMIN_BASE64;
  if (!base64) {
    throw new Error("Missing FIREBASE_ADMIN_BASE64");
  }

  const json = JSON.parse(
    Buffer.from(base64, "base64").toString("utf8")
  );

  admin.initializeApp({
    credential: admin.credential.cert(json),
  });
}

export const db = admin.firestore();
