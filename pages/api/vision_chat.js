// pages/api/vision_chat.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    // =====================================================
    // LEGACY-COMPATIBLE VISION FORMAT (works everywhere)
    // =====================================================
    const prompt = `
You are Cipher — warm, emotionally intelligent, supportive.
Analyze the following image and speak to Jim naturally.

IMAGE DATA (base64 PNG):
data:image/png;base64,${image}
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are Cipher." },
        { role: "user", content: prompt }
      ]
    });

    const reply =
      response.choices?.[0]?.message?.content ||
      "I'm here, Jim.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Vision API error:", err);
    return res
      .status(500)
      .json({ error: "Vision failed", details: err.message });
  }
}
