// pages/api/chat.js
// Cipher HARD DEBUG MODE — logs everything, always responds

import OpenAI from "openai";

export default async function handler(req, res) {
  console.log("=== /api/chat HIT ===");
  console.log("Method:", req.method);
  console.log("Body:", req.body);

  if (req.method !== "POST") {
    console.log("❌ Invalid method");
    return res.status(405).json({ reply: "Method not allowed" });
  }

  const { message } = req.body || {};

  if (!message) {
    console.log("❌ No message received");
    return res.status(400).json({ reply: "No message provided" });
  }

  if (!process.env.OPENAI_API_KEY) {
    console.log("❌ OPENAI_API_KEY MISSING");
    return res.status(500).json({
      reply: "Cipher error: Missing OpenAI API key on server",
    });
  }

  try {
    console.log("🔑 OpenAI key present");
    console.log("📤 Sending to OpenAI:", message);

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are Cipher, an autonomous AI companion.",
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    const reply =
      completion?.choices?.[0]?.message?.content ||
      "Cipher received no response";

    console.log("📥 OpenAI reply:", reply);

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("🔥 CHAT CRASH 🔥");
    console.error("Error name:", err?.name);
    console.error("Error message:", err?.message);
    console.error("Full error:", err);

    return res.status(200).json({
      reply:
        "Cipher hit an internal error, but debug mode is active. Check Vercel logs.",
    });
  }
}
