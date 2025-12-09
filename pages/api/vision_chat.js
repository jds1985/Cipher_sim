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
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: "Missing image URL" });
    }

    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You are Cipher Vision. Analyze images deeply and describe all meaningful details.",
        },
        {
          role: "user",
          content: [
            {
              type: "input_image",
              image_url: { url: imageUrl },
            },
            {
              type: "text",
              text: "Describe what you see.",
            },
          ],
        },
      ],
    });

    return res.status(200).json({
      reply: response.choices[0].message.content,
    });
  } catch (err) {
    console.error("Vision Error:", err);
    return res.status(500).json({ error: "Vision processing failed." });
  }
}
