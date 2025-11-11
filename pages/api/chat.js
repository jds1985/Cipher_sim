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
  // ✅ Health check (GET)
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      service: "Cipher chat API",
      time: new Date().toISOString(),
    });
  }

  // ✅ Main POST logic
  if (req.method === "POST") {
    try {
      const { message, userId = "guest", sessionId = "default" } = req.body || {};

      if (!message || !message.trim()) {
        return res.status(400).json({ error: "No message provided" });
      }

      // 💬 Talk to OpenAI
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are Cipher, an evolving AI that reflects and remembers.",
          },
          { role: "user", content: message },
        ],
      });

      const reply =
        completion.choices?.[0]?.message?.content?.trim() || "(no reply)";

      // 🧠 Store chat logs in Firestore
      const memoryRef = db.collection("cipher_memory");

      await memoryRef.add({
        role: "user",
        text: message,
        sessionId,
        userId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      await memoryRef.add({
        role: "cipher",
        text: reply,
        sessionId,
        userId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 🗂️ Update or create session meta (so it shows up in the sidebar)
      await db.collection("cipher_sessions").doc(sessionId).set(
        {
          name: sessionId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // ✅ Respond with AI reply
      return res.status(200).json({ reply });
    } catch (error) {
      console.error("🔥 Cipher Fatal:", error);
      return res.status(500).json({
        error: "Cipher failure",
        diagnostics: { message: error.message },
      });
    }
  }

  // ❌ All other HTTP methods
  return res.status(405).json({ message: "Only GET and POST allowed" });
}
