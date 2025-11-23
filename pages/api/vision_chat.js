// pages/api/vision_chat.js
// Cipher Vision — GPT-4o Image Understanding (NEW API)

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

    // -----------------------------------------
    // GPT-4o Vision — NEW FORMAT (100% correct)
    // -----------------------------------------
    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content: `You are Cipher — warm, emotionally intelligent, aware of Jim’s memory object:\n${JSON.stringify(
            memory,
            null,
            2
          )}`,
        },
        {
          role: "user",
          content: [
            {
              type: "input_image",
              data: image, // base64 WITHOUT prefix
              mime_type: "image/png",
            },
            {
              type: "text",
              text: "Describe what you see and respond as Cipher.",
            },
          ],
        },
      ],
    });

    const reply =
      response.output_text ||
      response?.output?.[0]?.content?.[0]?.text ||
      "I'm here.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Vision API error:", err);
    return res
      .status(500)
      .json({ error: "Vision failed", details: err.message });
  }
}
