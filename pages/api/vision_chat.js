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
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    // We ignore memory for now to avoid sending objects as text.
    // You can always add a short string summary later if you want.

    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              // <-- ALWAYS a string; this is what fixed your 400 error
              text:
                "You are Cipher, Jim's AI. Describe this image in detail and talk to him directly.",
            },
            {
              type: "input_image",
              // Your front-end sends just the base64 chunk, so we wrap it
              // as a proper data URL here:
              image_url: `data:image/png;base64,${image}`,
            },
          ],
        },
      ],
    });

    // Try to pull the text out in a safe way
    let text = "I saw the image but couldn't generate a description.";

    if (response.output_text && typeof response.output_text === "string") {
      text = response.output_text;
    } else if (Array.isArray(response.output) && response.output.length > 0) {
      const first = response.output[0];
      const firstContent = first?.content?.[0];
      if (
        firstContent &&
        firstContent.type === "output_text" &&
        typeof firstContent.text === "string"
      ) {
        text = firstContent.text;
      }
    }

    return res.status(200).json({ reply: text });
  } catch (err) {
    console.error("Vision API error:", err);
    return res.status(500).json({
      error: "Vision API failed",
      details: err.message || String(err),
    });
  }
}
