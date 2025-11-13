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
    if (req.method === "GET") {
      // 🔹 Fetch ALL messages, ordered by timestamp
      const snapshot = await db
        .collection("cipher_memory")
        .orderBy("timestamp", "asc")
        .get();

      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      return res.status(200).json({ messages });
    }

    if (req.method === "DELETE") {
      // 🔹 Clear all memory (optional reset button)
      const snapshot = await db.collection("cipher_memory").get();
      const batch = db.batch();
      snapshot.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      return res.status(200).json({ success: true, message: "All memory cleared." });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("memory.js error:", error);
    return res.status(500).json({ error: "Memory retrieval failed", details: error.message });
  }
}
