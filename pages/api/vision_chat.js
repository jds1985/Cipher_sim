// pages/api/vision_chat.js
// Cipher Vision — OpenAI v5 SDK (SAFE AUDIO VERSION)

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

    // Ensure memory is a clean string for input_text
    const prompt =
      typeof memory === "string" && memory.trim().length > 0
        ? memory
        : "Describe this image as Cipher.";

    // -------------------------
    // V5: USE responses.create()
    // -------------------------
    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            {
              type: "input_image",
              image_url: `data:image/png;base64,${image}`,
            },
          ],
        },
      ],
      // ★ ADD AUDIO OUTPUT SAFELY
      audio: {
        voice: "alloy",
        format: "mp3",
      },
    });

    // -------------------------
    // PARSE TEXT REPLY SAFE
    -------------------------
    const text =
      response.output_text ||
      response.output?.[0]?.content?.[0]?.text ||
      "I saw the image but couldn't generate a description.";

    // -------------------------
    // PARSE AUDIO SAFE
    // -------------------------
    let audioBase64 = null;

    try {
      audioBase64 =
        response.output?.[0]?.content?.find((c) => c.type === "output_audio")
          ?.audio_base64 || null;
    } catch {
      audioBase64 = null;
    }

    return res.status(200).json({
      reply: text,
      voice: audioBase64, // null if missing (SAFE)
    });
  } catch (err) {
    console.error("Vision API error:", err);
    return res.status(500).json({
      error: "Vision API failed",
      details: err.message,
    });
  }
}
