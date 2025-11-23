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
    const { image, memory } = req.body;

    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    // GPT-4o vision message format
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are Cipher — warm, emotionally intelligent, supportive. Use visual understanding + Jim's memory naturally."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image as Cipher."
            },
            {
              type: "image_url",
              image_url: `data:image/png;base64,${image}`
            }
          ]
        }
      ]
    });

    const reply =
      response.choices?.[0]?.message?.content || "I'm here, Jim.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Vision API error:", err);
    return res
      .status(500)
      .json({ error: "Vision failed", details: err.message });
  }
}
