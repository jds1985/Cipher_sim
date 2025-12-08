// pages/api/vision_chat.js
// Cipher Vision — GPT-4.1 mini image analysis

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { image, userId } = req.body;

    if (!image || typeof image !== "string") {
      return res.status(400).json({ error: "No image provided" });
    }

    // Optional debug: see payload size in logs
    console.log(
      "Cipher Vision request:",
      userId || "no-user",
      "image length:",
      image.length
    );

    // Call GPT-4.1 mini with vision
    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You are Cipher Vision, part of the Cipher AI system. Analyze images deeply, describe what you see, and highlight any details that might matter to Jim or Cipher's ongoing memory.",
        },
        {
          role: "user",
          content: [
            {
              type: "input_image",
              image_url: { url: image }, // data URL from client
            },
            {
              type: "text",
              text:
                "Describe what you see in this image. Be detailed but concise. If there are people, objects, or text, mention them clearly.",
            },
          ],
        },
      ],
    });

    const reply =
      response.choices?.[0]?.message?.content ||
      "I couldn't analyze that image.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Vision Error:", err);
    return res.status(500).json({ error: "Vision processing failed." });
  }
}
