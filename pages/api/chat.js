// pages/api/chat.js
// Cipher — Stable OpenAI Transport (Vercel-safe)

import OpenAI from "openai";

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  console.log("=== /api/chat HIT ===");

  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed" });
  }

  const { message } = req.body || {};

  if (!message) {
    return res.status(400).json({ reply: "No message provided" });
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY MISSING");
    return res.status(500).json({ reply: "Missing OpenAI API key" });
  }

  try {
    console.log("🔑 OpenAI key present");
    console.log("📤 Message:", message);

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: message,
    });

    const reply =
      response.output_text ||
      "Cipher received input but produced no output";

    console.log("📥 Reply:", reply);

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("🔥 OPENAI CONNECTION FAILURE 🔥");
    console.error(err);

    return res.status(200).json({
      reply:
        "Cipher failed to reach OpenAI. Connection error confirmed. Check deployment config.",
    });
  }
}
