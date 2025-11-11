// /pages/api/sessions.js
import admin from "firebase-admin";

// Safe one-time init for firebase-admin
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
      // List sessions from meta collection
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
      const { sessionId } = req.query || {};
      if (!sessionId) {
        return res.status(400).json({ error: "sessionId is required" });
      }

      // Delete all messages in this session (batched)
      const batchSize = 400;
      let deletedTotal = 0;
      // eslint-disable-next-line no-constant-condition
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

      // Remove meta doc
      await db.collection("cipher_sessions").doc(sessionId).delete();

      return res.status(200).json({ ok: true, deleted: deletedTotal });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error("sessions API error:", e);
    return res.status(500).json({ error: e.message });
  }
}
