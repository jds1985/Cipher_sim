// pages/api/voice_chat.js
// Cipher 5.0 — Voice Input → Whisper → Core → TTS

import OpenAI from "openai";
import { runGuard } from "../../cipher_core/guard";
import { runCipherCore } from "../../cipher_core/core";

import { FormData, File } from "formdata-node";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper: convert base64 → File
function base64ToFile(base64String, filename) {
  const buffer = Buffer.from(base64String, "base64");
  return new File([buffer], filename, { type: "audio/webm" });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { audio, memory } = req.body;

    if (!audio) {
      return res.status(400).json({ error: "No audio data received" });
    }

    // Convert base64 audio to File
    const audioFile = base64ToFile(audio, "input.webm");

    // ---------------------------
    // 1. TRANSCRIBE WITH WHISPER
    // ---------------------------
    const form = new FormData();
    form.set("file", audioFile);
    form.set("model", "gpt-4o-mini-tts"); // whisper-compatible
    form.set("response_format", "json");

    let transcriptText = "";
    try {
      const whisperResponse = await client.audio.transcriptions.create(form);
      transcriptText = whisperResponse.text || "";
    } catch (err) {
      console.error("Whisper error:", err);
      return res.status(500).json({
        error: "Whisper failed",
      });
    }

    // Safety check
    const safeText = await runGuard(transcriptText);

    // If Whisper hears nothing, don't continue
    if (!safeText.trim()) {
      return res.status(200).json({
        transcript: "",
        reply: "I couldn't hear anything — please try again.",
        voice: null,
      });
    }

    // -------------------------------------
    // 2. RUN THROUGH CIPHER CORE
    // -------------------------------------
    const reply = await runCipherCore({
      message: safeText,
      memory: memory || [],
    });

    // -------------------------------------
    // 3. TTS (Voice Output)
    // -------------------------------------
    let base64Voice = null;
    try {
      const speech = await client.audio.speech.create({
        model: "gpt-4o-mini-tts",
        voice: "verse",
        input: reply,
        format: "mp3",
      });

      const speechBuf = Buffer.from(await speech.arrayBuffer());
      base64Voice = speechBuf.toString("base64");
    } catch (err) {
      console.error("TTS error:", err);
    }

    // ---------------------------
    // 4. SEND BACK TO FRONTEND
    // ---------------------------
    return res.status(200).json({
      transcript: safeText,
      reply,
      voice: base64Voice,
    });
  } catch (err) {
    console.error("VoiceChat global error:", err);
    return res.status(500).json({ error: "Voice processing failed" });
  }
}
