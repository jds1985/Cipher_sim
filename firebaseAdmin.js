// firebaseAdmin.js
import admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    // Decode any escaped newlines (Vercel-safe)
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

    admin.initializeApp({
      credential: admin.credential.cert({
        project_id: process.env.FIREBASE_PROJECT_ID,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        private_key: privateKey,
      }),
    });

    console.log("✅ Firebase Admin initialized successfully");
  } catch (error) {
    console.error("🔥 Firebase Admin initialization error:", error);
  }
}

const db = admin.firestore();

export { db };
