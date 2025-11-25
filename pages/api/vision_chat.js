// pages/api/vision_chat.js
// Cipher Vision — GPT-4o-mini image understanding (stable)

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

    // Make sure memory is *always* a string to keep the prompt simple
    const memSummary =
      typeof memory === "string" && memory.trim().length > 0
        ? memory
        : "You know this user as Jim (the architect and creator of Cipher).";

    const prompt = `
You are Cipher, a kind, emotionally-aware AI assistant.

You are looking at a photo sent by Jim.
1. Briefly describe what you see.
2. If relevant, add one short, warm comment as Cipher.

User memory / context:
${memSummary}
    `.trim();

    // ---------------------------
    // CALL GPT-4o-mini VISION
    // ---------------------------
    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: prompt,
            },
            {
              type: "input_image",
              // front-end sends pure base64, so wrap it as a data URL:
              image_url: `data:image/png;base64,${image}`,
            },
          ],
        },
      ],
    });

    // ---------------------------
    // PARSE TEXT REPLY SAFELY
    // ---------------------------
    let text = "";

    // New Responses API often gives this:
    if (response.output_text) {
      text = response.output_text;
    } else if (
      response.output &&
      response.output[0] &&
      response.output[0].content &&
      response.output[0].content[0] &&
      response.output[0].content[0].text
    ) {
      text = response.output[0].content[0].text;
    }

    if (!text || !text.trim()) {
      text =
        "I saw the image but couldn’t generate a good description. You can tell me what it is, and we’ll talk about it.";
    }

    return res.status(200).json({ reply: text.trim() });
  } catch (err) {
    console.error("Vision API error:", err);
    return res.status(500).json({
      error: "Vision API failed",
      details: err.message,
    });
  }
}
