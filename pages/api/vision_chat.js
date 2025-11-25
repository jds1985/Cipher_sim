// pages/api/vision_chat.js
// Cipher Vision Route — GPT-4o Vision + Core + TTS

import OpenAI from "openai";
import { runGuard } from "../../cipher_core/guard";
import { runCipherCore } from "../../cipher_core/core";
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
      return res.status(400).json({ error: "Missing image data." });
    }

    // ------------------------------------
    // 1) Prepare image blob
    // ------------------------------------
    const buffer = Buffer.from(image, "base64");

    // ------------------------------------
    // 2) Vision → caption text
    // ------------------------------------
    const visionResp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Describe this image in detail." },
            {
              type: "image_url",
              image_url: "data:image/png;base64," + image,
            }
          ],
        }
      ],
    });

    const description =
      visionResp.choices?.[0]?.message?.content || "I saw something, but I'm not sure what.";

    // ------------------------------------
    // 3) Send description through Cipher Core
    // ------------------------------------
    const safeText = await runGuard(description);
    const cipherReply = await runCipherCore({
      message: safeText,
      memory: memory || {},
    });

    // ------------------------------------
    // 4) Save memory
    // ------------------------------------
    await saveMemory({
      timestamp: Date.now(),
      user: "[vision input]",
      cipher: cipherReply,
    });

    // ------------------------------------
    // 5) Convert reply → speech
    // ------------------------------------
    const ttsResp = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "verse",
      input: cipherReply,
      format: "mp3",
    });

    const mp3Buffer = Buffer.from(await ttsResp.arrayBuffer());
    const voiceBase64 = mp3Buffer.toString("base64");

    // ------------------------------------
    // 6) Return result
    // ------------------------------------
    return res.status(200).json({
      reply: cipherReply,
      voice: voiceBase64,
      rawVision: description,
    });

  } catch (err) {
    console.error("Vision API error:", err);
    return res.status(500).json({
      error: "Vision route failed",
      details: err.message,
    });
  }
}
