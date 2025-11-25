// pages/api/voice_chat.js
// Cipher Voice Route — Whisper + Core + TTS

import OpenAI from "openai";
import { runGuard } from "../../cipher_core/guard";
import { runCipherCore } from "../../cipher_core/core";
import { saveMemory } from "../../cipher_core/memory";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// --- IMPORTANT ---
// Node 18+ provides native Blob + File.
// Vercel also supports these natively.
// ------------------

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { audio, memory } = req.body;

    if (!audio) {
      return res.status(400).json({ error: "Missing audio data" });
    }

    // Convert base64 → ArrayBuffer → Blob
    const buffer = Buffer.from(audio, "base64");
    const blob = new Blob([buffer], { type: "audio/webm" });

    // Convert blob → File (OPENAI REQUIRES A FILE)
    const file = new File([blob], "audio.webm", { type: "audio/webm" });

    // 1) Whisper Transcription
    const transcriptResp = await client.audio.transcriptions.create({
      file,
      model: "gpt-4o-transcribe",
    });

    const transcript = transcriptResp.text || "";

    // 2) Process through your guard + core
    const safeTranscript = await runGuard(
      transcript.trim() || "[empty voice input]"
    );

    const coreReply = await runCipherCore({
      message: safeTranscript,
      memory: memory || {},
    });

    // 3) Save memory to Firestore
    await saveMemory({
      timestamp: Date.now(),
      message: safeTranscript,
      cipherReply: coreReply,
    });

    // 4) Generate TTS output
    const ttsResp = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "verse",
      input: coreReply,
      format: "mp3",
    });

    const voiceBase64 = Buffer.from(await ttsResp.arrayBuffer()).toString(
      "base64"
    );

    return res.status(200).json({
      transcript,
      reply: coreReply,
      voice: voiceBase64,
    });
  } catch (err) {
    console.error("VOICE ERROR:", err);
    return res.status(500).json({ error: "Voice route failed", details: err+" " });
  }
}
