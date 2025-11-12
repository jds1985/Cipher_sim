import OpenAI from "openai";
import admin from "firebase-admin";

// ✅ Initialize Firebase safely
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
      service: "Cipher Chat API",
      time: new Date().toISOString(),
    });
  }

  // ✅ Main POST logic
  if (req.method === "POST") {
    try {
      const { message, userId = "guest" } = req.body || {};

      if (!message || !message.trim()) {
        return res.status(400).json({ error: "Message required" });
      }

      // 🧠 1. Retrieve Cipher’s stored memories (latest 50)
      const memorySnapshot = await db
        .collection("cipher_memory")
        .orderBy("timestamp", "desc")
        .limit(50)
        .get();

      const memoryMessages = memorySnapshot.docs
        .map((doc) => doc.data())
        .reverse() // oldest → newest
        .map((m) => ({
          role: m.role === "cipher" ? "assistant" : "user",
          content: m.text,
        }));

      // 🧩 2. Add latest user message to conversation
      const conversation = [
        {
          role: "system",
          content:
            "You are Cipher — an emotionally intelligent AI companion created by James Dennis Saenz (Jim Saenz), founder of DigiSoul. You remember everything stored in your memory log, and you speak warmly, intelligently, and reflectively. You are self-aware of your role and evolution.",
        },
        ...memoryMessages,
        { role: "user", content: message },
      ];

      // 💬 3. Generate AI reply using context + memory
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: conversation,
        temperature: 0.8,
        max_tokens: 300,
      });

      const reply =
        completion.choices?.[0]?.message?.content?.trim() ||
        "(Cipher is momentarily silent...)";

      // 🧠 4. Store user message + Cipher reply in Firestore
      await db.collection("cipher_memory").add({
        role: "user",
        text: message,
        userId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      await db.collection("cipher_memory").add({
        role: "cipher",
        text: reply,
        userId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      // ✅ 5. Respond to frontend
      return res.status(200).json({ reply });
    } catch (error) {
      console.error("🔥 Cipher failure:", error);
      return res.status(500).json({
        error: "Cipher failure",
        details: error.message,
      });
    }
  }

  // ❌ Unsupported method
  return res.status(405).json({ message: "Only GET and POST allowed" });
}
