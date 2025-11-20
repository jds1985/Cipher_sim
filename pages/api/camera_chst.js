// pages/api/camera_chat.js
// Cipher camera route — look at an image and respond

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

    // image is a data URL from the browser (data:image/...;base64,...)
    const imageUrl = image;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are Cipher, an AI companion. The user has sent you an image. Describe what you see and talk to them about it in a grounded, friendly, practical way.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Here is an image I'm sharing. Describe it and respond like Cipher.",
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
      "I see something, but I'm not sure how to describe it yet.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Camera chat error:", err);
    return res.status(500).json({ error: err.message });
  }
}
