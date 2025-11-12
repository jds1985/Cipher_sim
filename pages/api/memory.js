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
  // Health check
  if (req.method === "GET" && !req.query.sessionId) {
    return res.status(200).json({
      ok: true,
      service: "Cipher memory API",
      time: new Date().toISOString(),
    });
  }

  // Get memory messages
  if (req.method === "GET") {
    try {
      const snapshot = await db
        .collection("cipher_memory")
        .orderBy("timestamp", "asc")
        .limit(100)
        .get();

      const messages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return res.status(200).json({ messages });
    } catch (error) {
      console.error("memory.js error:", error);
      return res.status(500).json({
        error: "Error fetching messages",
        details: error.message,
      });
    }
  }

  // Add a new message (optional future use)
  if (req.method === "POST") {
    try {
      const { role, text, userId = "guest" } = req.body;
      if (!text) {
        return res.status(400).json({ error: "No text provided" });
      }

      await db.collection("cipher_memory").add({
        role,
        text,
        userId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return res.status(200).json({ ok: true });
    } catch (error) {
      console.error("memory.js POST error:", error);
      return res.status(500).json({
        error: "Error saving message",
        details: error.message,
      });
    }
  }

  // Unsupported method
  return res.status(405).json({ error: "Method not allowed" });
}
