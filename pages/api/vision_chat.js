// pages/api/vision_chat.js
// Cipher Vision — GPT-4o Image Understanding

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { image, memory } = req.body;

    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    // ---------------------------
    // NEW GPT-4o VISION FORMAT
    // ---------------------------
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are Cipher — warm, emotionally intelligent, and supportive. Use visual understanding + Jim’s memory naturally.",
        },
        {
          role: "user",
          content: [
            {
              type: "input_image",
              image_url: `data:image/png;base64,${image}`,
            },
            {
              type: "input_text",
              text: "Analyze this image and reply as Cipher.",
            },
          ],
        },
      ],
    });

    const reply = response.choices?.[0]?.message?.content || "I’m here.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Vision API error:", err);
    return res
      .status(500)
      .json({ error: "Vision failed", details: err.message });
  }
}
