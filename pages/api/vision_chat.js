// pages/api/vision_chat.js
// Cipher Vision Route — GPT-4o Vision (Image → Text)

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
      return res.status(400).json({ error: "No image provided." });
    }

    // -------------------------------
    // SEND TO GPT-4o Vision
    // -------------------------------
    const result = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are Cipher — emotionally aware, helpful, and capable of analyzing images."
        },
        {
          role: "user",
          content: [
            {
              type: "input_image",
              image_url: `data:image/png;base64,${image}`,
            },
            {
              type: "text",
              text: "Analyze the image and respond in Cipher’s tone.",
            }
          ]
        }
      ]
    });

    const reply = result.choices?.[0]?.message?.content || 
      "I saw the image, but I wasn’t able to understand it.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("VISION ERROR:", err);
    return res.status(500).json({
      error: "Vision processing failed.",
      details: err.message,
    });
  }
}
