// pages/api/vision_chat.js
// Cipher Vision Route — GPT-4o Image Input

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

    const result = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are Cipher, an emotionally-aware assistant. Analyze the image and speak naturally.",
        },
        {
          role: "user",
          content: [
            {
              type: "input_image",
              image_url: `data:image/jpeg;base64,${image}`,
            },
            {
              type: "text",
              text: "Analyze this image and respond in Cipher’s tone. Use memory if helpful.",
            },
          ],
        },
      ],
    });

    const reply = result.choices?.[0]?.message?.content || "I saw the image.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Vision API Error:", err);
    return res.status(500).json({
      error: "Vision failed.",
      details: err.message,
    });
  }
}
