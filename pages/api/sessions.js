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
    if (req.method === "GET") {
      // 📜 Get a list of all sessions
      const snap = await db
        .collection("cipher_sessions")
        .orderBy("updatedAt", "desc")
        .limit(100)
        .get();

      const sessions = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() || {}),
      }));

      return res.status(200).json({ sessions });
    }

    if (req.method === "POST") {
      // ➕ Create or update a session
      const { name } = req.body || {};
      const sessionId = (name || "").trim() || "default";

      await db.collection("cipher_sessions").doc(sessionId).set(
        {
          name: sessionId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return res.status(200).json({ ok: true, sessionId });
    }

    if (req.method === "DELETE") {
      // ❌ Delete session and its messages
      const { sessionId } = req.query || {};
      if (!sessionId) {
        return res.status(400).json({ error: "Missing sessionId" });
      }

      // 🧹 Delete all messages in this session
      const batchSize = 400;
      let deletedTotal = 0;
      while (true) {
        const q = await db
          .collection("cipher_memory")
          .where("sessionId", "==", sessionId)
          .limit(batchSize)
          .get();

        if (q.empty) break;

        const batch = db.batch();
        q.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
        deletedTotal += q.size;
        if (q.size < batchSize) break;
      }

      // 🗂️ Remove the session meta doc
      await db.collection("cipher_sessions").doc(sessionId).delete();

      return res.status(200).json({ ok: true, deleted: deletedTotal });
    }

    // Unsupported method
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("🔥 sessions.js error:", error);
    return res.status(500).json({ error: error.message });
  }
}
