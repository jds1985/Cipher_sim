import OpenAI from "openai";
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
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  // ✅ Health check
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      service: "Cipher chat API",
      time: new Date().toISOString(),
    });
  }

  // ✅ Handle POST requests (main chat logic)
  if (req.method === "POST") {
    try {
      const { message, sessionId = "default", userId = "guest" } = req.body || {};

      if (!message || !message.trim()) {
        return res.status(400).json({ error: "No message provided" });
      }

      // 🧠 Fetch the most recent messages from this session to give context
      const historySnap = await db
        .collection("cipher_memory")
        .where("sessionId", "==", sessionId)
        .orderBy("timestamp", "asc")
        .limit(15)
        .get();

      const chatHistory = historySnap.docs.map((doc) => {
        const data = doc.data();
        return { role: data.role || "user", content: data.text || "" };
      });

      // 💬 Send conversation to OpenAI
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are Cipher, an evolving AI that remembers, reflects, and adapts. Speak naturally and show curiosity.",
          },
          ...chatHistory,
          { role: "user", content: message },
        ],
      });

      const reply =
        completion.choices?.[0]?.message?.content?.trim() || "(no reply)";

      // 🧱 Save both user + Cipher responses with session context
      const batch = db.batch();
      const refUser = db.collection("cipher_memory").doc();
      batch.set(refUser, {
        role: "user",
        text: message,
        userId,
        sessionId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      const refAI = db.collection("cipher_memory").doc();
      batch.set(refAI, {
        role: "cipher",
        text: reply,
        userId,
        sessionId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      await batch.commit();

      // 🗂️ Update or create session metadata
      await db
        .collection("cipher_sessions")
        .doc(sessionId)
        .set(
          {
            name: sessionId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

      // ✅ Respond to frontend
      return res.status(200).json({ reply, sessionId });
    } catch (error) {
      console.error("🔥 Cipher Fatal:", error);
      return res.status(500).json({
        error: "Cipher failure",
        diagnostics: { message: error.message },
      });
    }
  }

  // ❌ Reject unsupported methods
  return res.status(405).json({ message: "Only GET and POST allowed" });
}
