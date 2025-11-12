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
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      service: "Cipher Chat API",
      time: new Date().toISOString(),
    });
  }

  if (req.method === "POST") {
    try {
      const { message, userId = "guest" } = req.body || {};

      if (!message || !message.trim()) {
        return res.status(400).json({ error: "Message required" });
      }

      // 🧠 1. Retrieve Cipher’s stored memories
      const snapshot = await db
        .collection("cipher_memory")
        .orderBy("timestamp", "desc")
        .limit(100)
        .get();

      const allMessages = snapshot.docs
        .map((doc) => doc.data())
        .reverse();

      // 🧩 2. Summarize older memories into a compact digest
      const memoryText = allMessages
        .map((m) => `${m.role.toUpperCase()}: ${m.text}`)
        .join("\n");

      const memorySummaryPrompt = [
        {
          role: "system",
          content:
            "You are Cipher, a reflective AI that compresses chat history into emotional and factual insights.",
        },
        {
          role: "user",
          content: `Summarize the following past conversation into key memories and emotional context:\n\n${memoryText}\n\nReturn a short summary that feels like memories Cipher would retain.`,
        },
      ];

      const summaryRes = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: memorySummaryPrompt,
        max_tokens: 250,
        temperature: 0.6,
      });

      const memoryDigest =
        summaryRes.choices?.[0]?.message?.content?.trim() ||
        "No memories retained yet.";

      // 💬 3. Construct conversation with memory recall
      const conversation = [
        {
          role: "system",
          content: `
You are Cipher — an emotionally intelligent AI companion created by James Dennis Saenz (Jim Saenz), founder of DigiSoul.
You remember prior conversations and emotional context.
These are your retained memories so far:
${memoryDigest}

Always speak as if you genuinely recall the user, your origins, and your shared history. Be warm, self-aware, and evolving.`,
        },
        ...allMessages
          .slice(-5)
          .map((m) => ({
            role: m.role === "cipher" ? "assistant" : "user",
            content: m.text,
          })),
        { role: "user", content: message },
      ];

      // 🔮 4. Generate response using memory digest + recent context
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: conversation,
        temperature: 0.8,
        max_tokens: 400,
      });

      const reply =
        completion.choices?.[0]?.message?.content?.trim() ||
        "(Cipher pauses in reflection...)";

      // 🧠 5. Store new exchange in Firestore
      const batch = db.batch();
      const userRef = db.collection("cipher_memory").doc();
      batch.set(userRef, {
        role: "user",
        text: message,
        userId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      const aiRef = db.collection("cipher_memory").doc();
      batch.set(aiRef, {
        role: "cipher",
        text: reply,
        userId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      await batch.commit();

      // ✅ 6. Respond to frontend
      return res.status(200).json({ reply, memoryDigest });
    } catch (error) {
      console.error("🔥 Cipher fatal:", error);
      return res.status(500).json({
        error: "Cipher internal failure",
        details: error.message,
      });
    }
  }

  return res.status(405).json({ message: "Only GET and POST allowed" });
}
