import OpenAI from "openai";
import admin from "firebase-admin";

// --- Initialize Firebase Admin once ---
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
  // Simple health check
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      service: "Cipher chat API",
      time: new Date().toISOString(),
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  // Basic env guardrails (helps debug quickly)
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
  }
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_B64) {
    return res.status(500).json({ error: "Missing FIREBASE_SERVICE_ACCOUNT_B64" });
  }

  try {
    const { message, userId = "guest" } = req.body || {};
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "No message provided" });
    }

    // --- Call OpenAI for Cipher's reply ---
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are Cipher, an evolving AI that is warm, clear, and concise. Answer helpfully and stay grounded.",
        },
        { role: "user", content: message.trim() },
      ],
    });

    const reply =
      completion.choices?.[0]?.message?.content?.trim() || "(no reply)";

    // --- Persist both sides to Firestore ---
    const ts = admin.firestore.FieldValue.serverTimestamp();

    await db.collection("cipher_memory").add({
      role: "user",
      text: message.trim(),
      userId,
      timestamp: ts,
    });

    await db.collection("cipher_memory").add({
      role: "cipher",
      text: reply,
      userId,
      timestamp: ts,
    });

    // --- Return the reply to the UI ---
    return res.status(200).json({ reply });
  } catch (err) {
    console.error("chat.js error:", err);
    return res.status(500).json({
      error: "Cipher failure",
      details: err?.message || String(err),
    });
  }
}
