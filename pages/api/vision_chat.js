// pages/api/vision_chat.js
// Cipher Vision — OpenAI v5 SDK

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

    // -------------------------
    // V5: USE responses.create()
    // -------------------------
    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: memory || "Describe this image." },
            {
              type: "input_image",
              image_url: image,
            },
          ],
        },
      ],
    });

    const text =
      response.output_text ||
      response.output?.[0]?.content?.[0]?.text ||
      "I saw the image but couldn't generate a description.";

    return res.status(200).json({ reply: text });
  } catch (err) {
    console.error("Vision API error:", err);
    return res.status(500).json({ error: "Vision API failed", details: err });
  }
}
