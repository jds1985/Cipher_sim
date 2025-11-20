// pages/api/vision_chat.js
// Cipher Vision — Single Image Analysis

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { image } = req.body; // base64 (no data: prefix)

    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    const imageUrl = `data:image/jpeg;base64,${image}`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are Cipher, a grounded AI assistant. You can see the user's photo. Describe what you see and respond in a helpful, calm way.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Look at this image and tell me what you see, then talk to me about it as Cipher.",
            },
            {
              type: "image_url",
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
    });

    const reply =
      completion.choices?.[0]?.message?.content?.trim() ||
      "I saw the image, but I couldn't make sense of it.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Vision API error:", err);
    return res.status(500).json({ error: "Vision processing failed." });
  }
}
