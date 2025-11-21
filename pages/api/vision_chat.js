// pages/api/vision_chat.js
// Cipher Vision Route — Image -> GPT-4o-mini

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

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are Cipher, an emotionally-aware assistant with visual understanding. Be warm, grounded, and supportive.",
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                "Analyze this image and respond as Cipher. If it's helpful, reference what you already know about Jim, DigiSoul, and CipherTech.",
            },
            {
              type: "input_image",
              image_url: `data:image/png;base64,${image}`,
            },
          ],
        },
      ],
    });

    const reply = response.choices[0]?.message?.content || "I saw the image.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Vision API error:", err);
    return res.status(500).json({
      error: "Vision processing failed",
      details: err.message,
    });
  }
}
