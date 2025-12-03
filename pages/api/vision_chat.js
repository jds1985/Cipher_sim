// pages/api/vision_chat.js
// Cipher Vision – GPT-5.1 Image Understanding

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { image, prompt, memory } = req.body;

    if (!image || typeof image !== "string") {
      return res.status(400).json({ error: "No image URL provided" });
    }

    const userPrompt =
      prompt ||
      "You are Cipher, an advanced vision assistant. Analyze this image and describe what you see, then answer any obvious questions a human might have about it.";

    const systemPrompt =
      memory ||
      "You are Cipher, an AI that understands images, scenes, objects and context. Be clear, direct, and helpful.";

    const completion = await client.chat.completions.create({
      model: "gpt-5.1",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: userPrompt,
            },
            {
              type: "image_url",
              image_url: { url: image },
            },
          ],
        },
      ],
    });

    const reply = completion.choices[0]?.message?.content || "";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Cipher vision error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
