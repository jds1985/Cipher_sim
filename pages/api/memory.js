import admin from "firebase-admin";

// Initialize Firebase Admin once
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
  if (req.method === "GET") {
    try {
      let { sessionId = "default", limitCount = 200 } = req.query;
      sessionId = sessionId.trim(); // avoid space mismatch

      console.log("📡 Fetching memory for session:", sessionId);

      const qSnap = await db
        .collection("cipher_memory")
        .where("sessionId", "==", sessionId)
        .orderBy("timestamp", "asc")
        .limit(Number(limitCount))
        .get();

      const messages = qSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log(`🧠 Loaded ${messages.length} messages for session ${sessionId}`);
      return res.status(200).json({ sessionId, messages });
    } catch (err) {
      console.error("🔥 Memory fetch error:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ message: "Only GET supported" });
}
