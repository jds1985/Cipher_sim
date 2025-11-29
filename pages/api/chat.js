// pages/api/chat.js
// Cipher 7.3 — Deep Mode + Memory Pack + Unified TTS (verse)

import OpenAI from "openai";
import { runDeepMode } from "../../cipher_core/deepMode";
import { saveMemory } from "../../cipher_core/memory";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  try {
    // Method guard
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { message, userId = "jim_default" } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Invalid message" });
    }

    // ----------------------------------------------------
    // 1. RUN DEEP MODE (memory pack + SoulTree + profile)
    // ----------------------------------------------------
    const deepResult = await runDeepMode(message);

    const replyText =
      deepResult?.answer ||
      "I'm here with you — but I couldn't generate a proper reply from deep mode.";

    // ----------------------------------------------------
    // 2. GENERATE TTS (UNIFIED VOICE FOR TEXT CHAT)
    // ----------------------------------------------------
    let voiceBase64 = null;

    try {
      const ttsResp = await client.audio.speech.create({
        model: "gpt-4o-mini-tts",
        voice: "verse", // same as voice_chat + vision_chat
        input: replyText,
        format: "mp3",
      });

      const buf = Buffer.from(await ttsResp.arrayBuffer());
      voiceBase64 = buf.toString("base64");
    } catch (err) {
      console.error("CHAT TTS ERROR:", err);
      // Don't block reply if TTS fails
      voiceBase64 = null;
    }

    // ----------------------------------------------------
    // 3. SAVE MEMORY (NON-BLOCKING)
    // ----------------------------------------------------
    try {
      await saveMemory({
        userId,
        userMessage: message,
        cipherReply: replyText,
        meta: {
          source: "cipher_app",
          mode: "deep_mode",
          timestamp: Date.now(),
        },
      });
    } catch (err) {
      console.error("MEMORY SAVE ERROR (chat):", err);
      // Silently ignore – chat should still succeed
    }

    // ----------------------------------------------------
    // 4. RETURN FORMAT EXPECTED BY FRONTEND
    // ----------------------------------------------------
    return res.status(200).json({
      ok: true,
      reply: replyText,
      voice: voiceBase64,            // <- index.js will play this if present
      memoryHits: deepResult.memoryHits || null,
      soulHits: deepResult.soulHits || null,
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
