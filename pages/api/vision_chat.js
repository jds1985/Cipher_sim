// pages/api/vision_chat.js

import OpenAI from "openai";
import { loadMemory, saveMemory } from "../../cipher_core/memory";
import { db } from "../../firebaseAdmin";

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

    const visionResponse = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_image",
              image_url: `data:image/png;base64,${image}`,
            },
            {
              type: "input_text",
              text: "Explain what you see.",
            },
          ],
        },
      ],
    });

    const text = visionResponse.output_text || "I saw something.";

    // save to memory
    await saveMemory("vision_input", text);

    // Now synthesize voice
    const audioResponse = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: text,
      format: "mp3",
    });

    return res.json({
      reply: text,
      voice: audioResponse.base64,
    });

  } catch (err) {
    console.error("Vision API error:", err);
    return res.status(500).json({ error: "Vision failure", details: err.message });
  }
}
