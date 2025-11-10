// /firebaseAdmin.js
import admin from "firebase-admin";

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!admin.apps.length) {
  console.log("🟣 FirebaseAdmin: initializing…", {
    projectId: process.env.FIREBASE_PROJECT_ID,
    hasEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
    hasKey: !!privateKey,
  });

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });

  console.log("🟣 FirebaseAdmin: initialized.");
} else {
  console.log("🟣 FirebaseAdmin: reusing existing app.");
}

const db = admin.firestore();

// tiny ping to prove Firestore works (logged once at cold start)
(async () => {
  try {
    const cols = await db.listCollections();
    console.log(
      "🟢 Firestore connected. Collections:",
      cols.map(c => c.id)
    );
  } catch (e) {
    console.error("🔴 Firestore ping failed:", e.message);
  }
})();

export { db };
export default admin;
