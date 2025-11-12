// /pages/api/memory.js
import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(
        Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, "base64").toString()
      )
    ),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  try {
    const sessionId = req.query.sessionId || "default";

    // 🔒  Fetch only messages for this session
    const snapshot = await db
      .collection("cipher_memory")
      .where("sessionId", "==", sessionId)
      .orderBy("timestamp", "asc")
      .limit(250)
      .get();

    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({ sessionId, messages });
  } catch (err) {
    console.error("memory.js error:", err);
    res.status(500).json({ error: err.message });
  }
}
