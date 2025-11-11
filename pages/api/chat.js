import OpenAI from "openai";
import admin from "firebase-admin";

// 🧠 Initialize Firebase Admin (only once)
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
  // Health check
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      service: "Cipher chat API (session-aware)",
      time: new Date().toISOString(),
    });
  }

  // POST → handle message
  if (req.method === "POST") {
    try {
      const { message, userId = "guest", sessionId = "default" } = req.body || {};

      if (!message?.trim()) {
        return res.status(400).json({ error: "No message provided" });
      }

      // 🔮 Generate Cipher's reply
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are Cipher, an evolving AI that reflects and remembers contextually across sessions." },
          { role: "user", content: message },
        ],
      });

      const reply =
        completion.choices?.[0]?.message?.content?.trim() ||
        "(no reply)";

      // 🧾 Save both sides of conversation to Firestore
      const collectionRef = db.collection("cipher_memory");

      await Promise.all([
        collectionRef.add({
          sessionId,
          role: "user",
          text: message,
          userId,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        }),
        collectionRef.add({
          sessionId,
          role: "cipher",
          text: reply,
          userId,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        }),
      ]);

      return res.status(200).json({ reply });
    } catch (error) {
      console.error("🔥 Cipher API Error:", error);
      return res.status(500).json({
        error: "Cipher failure",
        diagnostics: { message: error.message },
      });
    }
  }

  return res.status(405).json({ message: "Only GET and POST allowed" });
}
