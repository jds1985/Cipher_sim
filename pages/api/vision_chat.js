// pages/api/vision_chat.js
// Cipher Vision — OpenAI Responses API (correct v5 format)

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

    const memTxt =
      typeof memory === "string" && memory.trim().length > 0
        ? memory
        : "Jim is the user. You are Cipher.";

    const prompt = `
You are Cipher. Describe the image warmly and naturally.
Use memory if helpful, but do not repeat it verbatim.

Memory:
${memTxt}
`.trim();

    // 🚨 CORRECT OpenAI v5 format — no roles, no content arrays
    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        { type: "input_text", text: prompt },
        {
          type: "input_image",
          image_url: `data:image/png;base64,${image}`,
        },
      ],
    });

    const out =
      response.output_text ||
      response.output?.[0]?.content?.[0]?.text ||
      "I saw the image but couldn’t describe it.";

    return res.status(200).json({ reply: out.trim() });
  } catch (err) {
    console.error("Vision API error:", err);
    return res.status(500).json({
      error: "Vision API failed",
      details: err.message,
    });
  }
}
