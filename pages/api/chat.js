// pages/api/chat.js
import OpenAI from "openai";

export default async function handler(req, res) {
  console.log("=== /api/chat HIT ===");

  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed" });
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY missing");
    return res.status(500).json({ reply: "Missing OpenAI API key" });
  }

  const { message } = req.body || {};
  if (!message) {
    return res.status(400).json({ reply: "No message provided" });
  }

  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: "You are Cipher, an autonomous AI companion." },
        { role: "user", content: message },
      ],
    });

    const reply =
      response.output_text ||
      response.output?.[0]?.content?.[0]?.text ||
      "No response";

    return res.status(200).json({ reply });

  } catch (err) {
    console.error("🔥 OPENAI RUNTIME ERROR:", err);
    return res.status(500).json({
      reply: "Cipher failed to reach OpenAI. Check logs.",
    });
  }
}
