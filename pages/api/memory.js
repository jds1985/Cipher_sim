// /pages/api/memory.js
import admin from "firebase-admin";

// Init Admin once
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
    const sessionId = (req.query.sessionId || "default").toString();

    // Try indexed query first
    try {
      const q = db
        .collection("cipher_memory")
        .where("sessionId", "==", sessionId)
        .orderBy("timestamp", "asc")
        .limit(1000);

      const snap = await q.get();
      const messages = snap.docs.map(d => d.data());
      return res.status(200).json({ sessionId, messages });
    } catch (indexedErr) {
      // Fallback (no composite index yet): fetch recent & filter in memory
      const snap = await db
        .collection("cipher_memory")
        .orderBy("timestamp", "desc")
        .limit(1000)
        .get();

      const messages = snap
        .docs
        .map(d => d.data())
        .filter(r => (r.sessionId || "default") === sessionId)
        .sort((a, b) => (a.timestamp?.toMillis?.() ?? 0) - (b.timestamp?.toMillis?.() ?? 0));

      return res.status(200).json({ sessionId, messages, fallback: true });
    }
  } catch (err) {
    console.error("🔥 Memory API error:", err);
    return res.status(500).json({ error: "Failed to load memory", details: err.message });
  }
}
