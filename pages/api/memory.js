import admin from "firebase-admin";

// ✅ Initialize Firebase Admin safely (only once)
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
    const { sessionId = "default", limitCount = 100 } = req.query;

    // 🔍 Fetch messages for this sessionId
    const snap = await db
      .collection("cipher_memory")
      .where("sessionId", "==", sessionId)
      .orderBy("timestamp", "asc")
      .limit(Number(limitCount))
      .get();

    const messages = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json({ sessionId, messages });
  } catch (error) {
    console.error("🔥 memory.js error:", error);
    return res.status(500).json({ error: error.message });
  }
}
