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

    // ===========================
    // CORRECT GPT-4o VISION FORMAT
    // ===========================
    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "You are Cipher — warm, emotionally intelligent, supportive. Use visual understanding + Jim's memory naturally."
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "Analyze this image as Cipher."
            },
            {
              type: "input_image",
              image_url: `data:image/png;base64,${image}`
            }
          ]
        }
      ]
    });

    const reply =
      response.output_text ||
      response.output[0]?.content[0]?.text ||
      "I'm here, Jim.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Vision API error:", err);
    return res.status(500).json({
      error: "Vision failed",
      details: err.message,
    });
  }
}
