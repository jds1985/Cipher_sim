// firebaseAdmin.js
import admin from "firebase-admin";

const serviceKey = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

// Only initialize once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceKey),
  });
  console.log("✅ Firebase Admin initialized");
}

const db = admin.firestore();

console.log("✅ Firestore ready (exporting db)");

module.exports = { db, admin };
