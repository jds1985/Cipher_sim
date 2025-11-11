// /pages/api/chat.js
import OpenAI from "openai";
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
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      service: "Cipher chat API",
      time: new Date().toISOString(),
    });
  }

  if (req.method === "POST") {
    try {
      const {
        message,
        userId = "guest",
        sessionId = "default",         // <-- accept sessionId from client
      } = req.body || {};

      if (!message || !message.trim()) {
        return res.status(400).json({ error: "No message provided" });
      }

      // OpenAI
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are Cipher, an evolving AI that reflects and remembers." },
          { role: "user", content: message },
        ],
      });

      const reply = completion.choices?.[0]?.message?.content?.trim() || "(no reply)";

      const now = admin.firestore.FieldValue.serverTimestamp();

      // Save both sides with sessionId
      await db.collection("cipher_memory").add({
        role: "user",
        type: "user",
        text: message,
        userId,
        sessionId,                      // <-- saved
        timestamp: now,
      });

      await db.collection("cipher_memory").add({
        role: "cipher",
        type: "cipher",
        text: reply,
        userId,
        sessionId,                      // <-- saved
        timestamp: now,
      });

      return res.status(200).json({ reply });
    } catch (error) {
      console.error("🔥 Cipher Fatal:", error);
      return res.status(500).json({
        error: "Cipher failure",
        diagnostics: { message: error.message },
      });
    }
  }

  return res.status(405).json({ message: "Only GET and POST allowed" });
}
