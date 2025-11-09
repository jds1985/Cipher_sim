// --- firebaseAdmin.js ---
// This uses the Firebase Admin SDK for secure server access.

import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

export const adminDB = admin.firestore();
export const FieldValue = admin.firestore.FieldValue;
