// pages/api/vision_chat.js
// Cipher Vision — describe image + speak it

import OpenAI from "openai";
import { saveMemory } from "../../cipher_core/memory";

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

    // ---------------------------------------------------
    // 1) VISION — describe the image with personality
    // ---------------------------------------------------
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
              text:
                "You are Cipher, a warm, emotionally intelligent AI. " +
                "Briefly describe what you see in this image, " +
                "then add one short, supportive personal comment to Jim.",
            },
          ],
        },
      ],
    });

    // Extract text from response
    let text = visionResponse.output_text;

    if (!text || !text.trim()) {
      // Fallback extraction path
      try {
        text =
          visionResponse.output?.[0]?.content?.[0]?.text ||
          "I saw the image but couldn't form a clear description.";
      } catch {
        text =
          "I saw the image but couldn't form a clear description.";
      }
    }

    // ---------------------------------------------------
    // 2) SAVE MEMORY
    // ---------------------------------------------------
    await saveMemory({
      timestamp: Date.now(),
      user: "[vision_input]",
      cipher: text,
    });

    // ---------------------------------------------------
    // 3) HUMAN-LIKE TTS
    // ---------------------------------------------------
    const audioResponse = await client.audio.speech.create({
      model: "gpt-4o-tts",     // human-quality TTS
      voice: "ballad",         // “verse” and “cove” are also human-like
      input: text,
      format: "mp3",
    });

    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
    const voiceBase64 = audioBuffer.toString("base64");

    // ---------------------------------------------------
    // 4) RETURN TEXT + AUDIO
    // ---------------------------------------------------
    return res.status(200).json({
      reply: text,
      voice: voiceBase64,
    });
  } catch (err) {
    console.error("Vision API error:", err);
    return res.status(500).json({
      error: "Vision failure",
      details: err.message,
    });
  }
}
