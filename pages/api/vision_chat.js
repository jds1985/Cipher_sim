// pages/api/vision_chat.js
// Cipher Vision – GPT-5.1 Image Understanding (Updated Format)

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
      return res.status(400).json({ error: "No image provided" });
    }

    const systemPrompt =
      memory ||
      "You are Cipher, an AI that understands images, scenes, objects, mood and context.";

    const userPrompt =
      prompt ||
      "Analyze the image and describe what you see with clarity and intuition.";

    const completion = await client.responses.create({
      model: "gpt-5.1",
      input: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            { type: "input_image", image_url: image },
          ],
        },
      ],
    });

    const reply = completion.output_text || "No response generated.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Cipher vision error:", err);
    return res.status(500).json({ error: "Vision processing failed." });
  }
}
