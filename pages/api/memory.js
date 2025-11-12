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
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Only GET allowed" });
  }

  try {
    // read the ?sessionId= param
    const { sessionId = "default" } = req.query;

    const ref = db.collection("cipher_memory");
    let queryRef = ref.where("sessionId", "==", sessionId).orderBy("timestamp", "asc");

    const snapshot = await queryRef.get();
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json({ sessionId, messages });
  } catch (error) {
    console.error("🔥 memory.js error:", error);
    return res.status(500).json({
      error: "Failed to load session memory",
      details: error.message,
    });
  }
}
