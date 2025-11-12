// /pages/api/chat.js
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

  // ✅ Handle chat requests (POST)
  if (req.method === "POST") {
    try {
      const { message, userId = "guest", sessionId = "default" } = req.body || {};

      if (!message || !message.trim()) {
        return res.status(400).json({ error: "No message provided" });
      }

      // 💬 Ask OpenAI for a reply
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are Cipher, an evolving AI that reflects and remembers. Respond conversationally and with emotional depth.",
          },
          { role: "user", content: message },
        ],
      });

      const reply =
        completion.choices?.[0]?.message?.content?.trim() || "(no reply)";

      // 🧠 Save chat messages to Firestore with session ID
      const timestamp = admin.firestore.FieldValue.serverTimestamp();

      await db.collection("cipher_memory").add({
        role: "user",
        text: message,
        userId,
        sessionId,
        timestamp,
      });

      await db.collection("cipher_memory").add({
        role: "cipher",
        text: reply,
        userId,
        sessionId,
        timestamp,
      });

      // ✅ Return Cipher’s reply to frontend
      return res.status(200).json({ reply });
    } catch (error) {
      console.error("Cipher Chat Error:", error);
      return res.status(500).json({
        error: "Cipher failure",
        details: error.message,
      });
    }
  }

  // ❌ Invalid method
  return res.status(405).json({ message: "Only GET and POST allowed" });
}
