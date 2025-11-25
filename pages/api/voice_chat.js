// pages/api/voice_chat.js
// Cipher Voice Route — Updated for new OpenAI SDK (Nov 2024+)

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
      console.error("VOICE ERROR: Missing audio");
      return res.status(400).json({ error: "Audio missing" });
    }

    // ------------------------------
    // 1) Base64 → WebM File
    // ------------------------------
    const buffer = Buffer.from(audio, "base64");
    const file = new File([buffer], "input.webm", {
      type: "audio/webm",
    });

    // ------------------------------
    // 2) TRANSCRIBE
    // ------------------------------
    const transcriptResp = await client.audio.transcriptions.create({
      file,
      model: "gpt-4o-transcribe",
    });

    const transcript = transcriptResp.text || "";
    console.log("TRANSCRIPT:", transcript);

    // ------------------------------
    // 3) GUARD + CORE
    // ------------------------------
    const safeTranscript =
      transcript.trim() || "[user sent empty voice input]";

    const guarded = await runGuard(safeTranscript);
    const coreReply = await runCipherCore({
      message: guarded,
      memory: memory || {},
    });

    // ------------------------------
    // 4) MEMORY SAVE
    // ------------------------------
    await saveMemory({
      message: safeTranscript,
      cipherReply: coreReply,
      timestamp: Date.now(),
    });

    // ------------------------------
    // 5) TTS OUTPUT (mp3)
    // ------------------------------
    const ttsResp = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "verse",
      input: coreReply,
      format: "mp3",
    });

    const ttsBuffer = Buffer.from(await ttsResp.arrayBuffer());
    const voiceBase64 = ttsBuffer.toString("base64");

    // ------------------------------
    // 6) RETURN FULL RESPONSE
    // ------------------------------
    return res.status(200).json({
      transcript,
      reply: coreReply,
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
