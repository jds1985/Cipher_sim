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
    const { image, memory } = req.body;

    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    // -----------------------------
    // 1) VISION: describe the image
    // -----------------------------
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

    let text = visionResponse.output_text;

    // Fallback in case output_text is missing
    if (
      (!text || !text.trim()) &&
      visionResponse.output &&
      visionResponse.output[0] &&
      visionResponse.output[0].content &&
      visionResponse.output[0].content[0] &&
      visionResponse.output[0].content[0].text
    ) {
      text = visionResponse.output[0].content[0].text;
    }

    if (!text || !text.trim()) {
      text =
        "I saw the image, but I wasn't able to generate a clear description. You can tell me what it is, and we can talk about it together.";
    }

    // -----------------------------
    // 2) SAVE TO MEMORY (new format)
    // -----------------------------
    await saveMemory({
      timestamp: Date.now(),
      user: "[vision_input]",
      cipher: text,
      // you could add more fields later if you want, e.g. rawImage: true
    });

    // -----------------------------
    // 3) TTS: speak the description
    // -----------------------------
    const audioResponse = await client.audio.speech.create({
  model: "gpt-4o-tts",  // <-- Use full TTS model for human-like voice
  voice: "ballad",      // <-- OR "verse" / "cove"
  input: text,
  format: "mp3",
});
      
      
      
  
    });

    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
    const voiceBase64 = audioBuffer.toString("base64");

    // -----------------------------
    // 4) RETURN text + voice
    // -----------------------------
    return res.status(200).json({
      reply: text,
      voice: voiceBase64,
    });
  } catch (err) {
    console.error("Vision API error:", err);
    return res
      .status(500)
      .json({ error: "Vision failure", details: err.message });
  }
}
