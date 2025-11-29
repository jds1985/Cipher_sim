// pages/api/voice_chat.js
// Cipher 7.3 — Voice Route (Whisper STT → Cipher Core → TTS "verse")

import OpenAI from "openai";
import { runGuard } from "../../cipher_core/guard";
import { runCipherCore } from "../../cipher_core/core";
import { saveMemory } from "../../cipher_core/memory";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Node 18+ / Vercel provide Blob + File globally

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { audio, memory } = req.body || {};

    if (!audio) {
      return res.status(400).json({ error: "Missing audio data" });
    }

    // ----------------------------------------------------
    // 1. base64 → Buffer → Blob → File (for Whisper)
    // ----------------------------------------------------
    const buffer = Buffer.from(audio, "base64");
    const blob = new Blob([buffer], { type: "audio/webm" });
    const file = new File([blob], "audio.webm", { type: "audio/webm" });

    // ----------------------------------------------------
    // 2. TRANSCRIBE (Whisper via gpt-4o-transcribe)
    // ----------------------------------------------------
    const transcriptResp = await client.audio.transcriptions.create({
      file,
      model: "gpt-4o-transcribe",
    });

    const transcript =
      transcriptResp?.text ||
      (typeof transcriptResp === "string" ? transcriptResp : "") ||
      "";

    const safeTranscript = await runGuard(
      transcript.trim() || "[empty voice input]"
    );

    // ----------------------------------------------------
    // 3. RUN THROUGH CIPHER CORE
    // ----------------------------------------------------
    const coreReply = await runCipherCore({
      message: safeTranscript,
      memory: memory || {},
    });

    // ----------------------------------------------------
    // 4. SAVE MEMORY (non-blocking)
    // ----------------------------------------------------
    try {
      await saveMemory({
        timestamp: Date.now(),
        message: safeTranscript,
        cipherReply: coreReply,
        meta: {
          source: "cipher_app",
          mode: "voice",
        },
      });
    } catch (err) {
      console.error("MEMORY SAVE ERROR (voice):", err);
    }

    // ----------------------------------------------------
    // 5. TTS FOR CIPHER REPLY (same model/voice as chat)
    // ----------------------------------------------------
    let voiceBase64 = null;

    try {
      const ttsResp = await client.audio.speech.create({
        model: "gpt-4o-mini-tts",
        voice: "verse",
        input: coreReply,
        format: "mp3",
      });

      const outBuf = Buffer.from(await ttsResp.arrayBuffer());
      voiceBase64 = outBuf.toString("base64");
    } catch (err) {
      console.error("VOICE TTS ERROR:", err);
      voiceBase64 = null;
    }

    // ----------------------------------------------------
    // 6. RESPONSE
    // ----------------------------------------------------
    return res.status(200).json({
      transcript,
      reply: coreReply,
      voice: voiceBase64,   // <- index.js uses this
    });
  } catch (err) {
    console.error("VOICE ERROR:", err);
    return res.status(500).json({
      error: "Voice route failed",
      details: String(err),
    });
  }
}
