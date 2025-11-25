// pages/api/vision_chat.js
// Cipher Vision Route — Image → Description → Voice Response

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
      return res.status(400).json({ error: "No image provided." });
    }

    // --------------------------------------
    // 1) VISION — Convert Base64 → Prompt
    // --------------------------------------
    const visionResp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "input_text", text: "Describe this image in detail." },
            {
              type: "input_image",
              image_url: `data:image/png;base64,${image}`,
            },
          ],
        },
      ],
    });

    const rawVisionText =
      visionResp.choices?.[0]?.message?.content ||
      "I saw the image, but couldn’t describe it.";

    // --------------------------------------
    // 2) Guard + Send to Core
    // --------------------------------------
    const safeText = await runGuard(rawVisionText);

    const coreReply = await runCipherCore({
      message: safeText,
      memory: memory || {},
    });

    // --------------------------------------
    // 3) Save Memory
    // --------------------------------------
    await saveMemory({
      timestamp: Date.now(),
      imageSummary: safeText,
      cipher: coreReply,
    });

    // --------------------------------------
    // 4) TTS — Voice Response
    // --------------------------------------
    const ttsResp = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "verse",
      input: coreReply,
      format: "mp3",
    });

    const audioBuffer = Buffer.from(await ttsResp.arrayBuffer());
    const voiceBase64 = audioBuffer.toString("base64");

    // --------------------------------------
    // 5) Return everything to the app
    // --------------------------------------
    return res.status(200).json({
      reply: coreReply,
      visionText: safeText,
      voice: voiceBase64,
    });
  } catch (err) {
    console.error("VISION ERROR:", err);
    return res.status(500).json({
      error: "Vision route failed",
      details: err.message,
    });
  }
}
