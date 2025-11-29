// pages/api/chat.js
// Cipher 7.2 — Deep Mode + Memory Pack Chat API

import OpenAI from "openai";
import { runDeepMode } from "../../cipher_core/deepMode";
import { saveMemory } from "../../cipher_core/memory";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { message, userId = "jim_default" } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Invalid message" });
    }

    // ----------------------------------------------------
    // 1. RUN DEEP MODE
    // ----------------------------------------------------
    const deepResult = await runDeepMode(message);
    const finalText = deepResult.answer || "No response.";

    // ----------------------------------------------------
    // 2. OPTIONAL TTS FOR TEXT CHAT
    // ----------------------------------------------------
    let voiceBase64 = null;
    try {
      const tts = await client.audio.speech.create({
        model: "gpt-4o-mini-tts",
        voice: "ally",
        input: finalText,
        format: "mp3",
      });

      voiceBase64 = Buffer.from(await tts.arrayBuffer()).toString("base64");
    } catch (err) {
      console.error("TTS ERROR (chat.js):", err);
    }

    // ----------------------------------------------------
    // 3. SAVE MEMORY (Non-blocking)
    // ----------------------------------------------------
    saveMemory({
      userId,
      userMessage: message,
      cipherReply: finalText,
      meta: {
        mode: "deep_mode",
        timestamp: Date.now(),
      },
    }).catch((e) => console.error("MEMORY SAVE ERROR:", e));

    // ----------------------------------------------------
    // 4. RETURN TO FRONTEND
    // ----------------------------------------------------
    return res.status(200).json({
      ok: true,
      reply: finalText,
      voice: voiceBase64,
      memoryHits: deepResult.memoryHits,
      soulHits: deepResult.soulHits,
    });

  } catch (err) {
    console.error("CHAT API ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: "Cipher encountered an internal server issue.",
      details: String(err),
    });
  }
}
