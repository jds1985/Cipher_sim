// pages/api/chat.js
// Cipher 7.8 — Deep Mode + Memory Pack + Optional TTS

import OpenAI from "openai";
import { runDeepMode } from "../../cipher_core/deepMode";
import { saveMemory } from "../../cipher_core/memory";
import { db } from "../../firebaseAdmin";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const {
      message,
      userId = "jim_default",
      voice = false, // if true, return TTS audio
    } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Invalid message" });
    }

    // ----------------------------------------------------
    // 1. RUN DEEP MODE
    // ----------------------------------------------------
    const deepResult = await runDeepMode(message);
    const finalText = deepResult.answer || "No response.";

    // ----------------------------------------------------
    // 2. SAVE MEMORY (Safe, non-blocking)
    // ----------------------------------------------------
    try {
      await saveMemory({
        userId,
        userMessage: message,
        cipherReply: finalText,
        meta: {
          source: "cipher_app",
          mode: "deep_mode",
          timestamp: Date.now(),
        },
      });
    } catch (err) {
      console.error("MEMORY SAVE ERROR:", err);
    }

    // ----------------------------------------------------
    // 3. OPTIONAL TTS
    // ----------------------------------------------------
    let voiceBase64 = null;

    if (voice) {
      try {
        const ttsResp = await client.audio.speech.create({
          model: "gpt-4o-mini-tts",
          voice: "verse",
          input: finalText,
          format: "mp3",
        });

        const buf = Buffer.from(await ttsResp.arrayBuffer());
        voiceBase64 = buf.toString("base64");
      } catch (err) {
        console.error("TTS ERROR (chat):", err);
      }
    }

    // ----------------------------------------------------
    // 4. RETURN FORMAT FOR FRONTEND
    // ----------------------------------------------------
    return res.status(200).json({
      ok: true,
      reply: finalText,
      memoryHits: deepResult.memoryHits,
      soulHits: deepResult.soulHits,
      voice: voiceBase64, // may be null if voice disabled or TTS failed
    });
  } catch (err) {
    console.error("CHAT API ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: "Cipher encountered an internal error.",
      details: String(err),
    });
  }
}
