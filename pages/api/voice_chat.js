// pages/api/voice_chat.js
// Cipher Voice Route — Whisper → Guard → Core → TTS (Stable Version)

import OpenAI from "openai";
import { File } from "formdata-node";
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
    const { audio, memory } = req.body;

    if (!audio) {
      return res.status(400).json({ error: "Missing audio data." });
    }

    // Convert base64 → File
    const buffer = Buffer.from(audio, "base64");
    const file = new File([buffer], "input.webm", { type: "audio/webm" });

    // 1) Transcription
    const transcriptResp = await client.audio.transcriptions.create({
      file,
      model: "gpt-4o-transcribe",
    });

    const transcript = transcriptResp.text || "";

    // 2) Guard + reasoning
    const safeText =
      (await runGuard(transcript.trim() || "[empty voice input]")) || "";

    let cipherReply = await runCipherCore({
      message: safeText,
      memory: memory || {},
    });

    // 🔥 HARD FIX: prevent undefined
    if (!cipherReply || typeof cipherReply !== "string") {
      cipherReply =
        "I heard you, but the reasoning chain was disrupted. Try again and I’ll listen.";
    }

    // 3) Save memory
    await saveMemory({
      timestamp: Date.now(),
      user: safeText,
      cipher: cipherReply,
    });

    // 4) TTS
    const ttsResp = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "verse",
      input: cipherReply,
      format: "mp3",
    });

    const ttsBuffer = Buffer.from(await ttsResp.arrayBuffer());
    const voiceBase64 = ttsBuffer.toString("base64");

    return res.status(200).json({
      transcript,
      reply: cipherReply,
      voice: voiceBase64,
    });
  } catch (err) {
    console.error("VOICE ERROR:", err);
    return res.status(500).json({
      error: "Voice route failed",
      details: err.message,
    });
  }
}
