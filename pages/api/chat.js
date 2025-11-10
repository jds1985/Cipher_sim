import { OpenAI } from "openai";
import { db } from "../../firebaseAdmin.js";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase-admin/firestore";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  // ✅ GET — simple health check
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      service: "Cipher chat API",
      time: new Date().toISOString(),
    });
  }

  // ✅ POST — main logic
  if (req.method === "POST") {
    try {
      const { message, userId = "guest" } = req.body || {};

      if (!message || !message.trim()) {
        return res.status(400).json({ error: "No message provided" });
      }

      // Talk to OpenAI
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

      // Save both sides of the chat
      await addDoc(collection(db, "cipher_memory"), {
        role: "user",
        text: message,
        userId,
        timestamp: serverTimestamp(),
      });
      await addDoc(collection(db, "cipher_memory"), {
        role: "cipher",
        text: reply,
        userId,
        timestamp: serverTimestamp(),
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

  // ❌ All other HTTP methods
  return res.status(405).json({ message: "Only GET and POST allowed" });
}
