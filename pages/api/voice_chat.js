// pages/api/voice_chat.js
// FIXED: Proper multipart/form-data upload for WebM → OpenAI

import OpenAI from "openai";
import { runGuard } from "../../cipher_core/guard";
import { runCipherCore } from "../../cipher_core/core";
import { saveMemory } from "../../cipher_core/memory";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "25mb",
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { audio, memory } = req.body;

    if (!audio) {
      return res.status(400).json({ error: "Missing audio" });
    }

    // Decode base64 → Buffer
    const audioBuffer = Buffer.from(audio, "base64");

    // Build multipart form-data manually
    const form = new FormData();
    form.append("model", "whisper-1"); // safest + stable
    form.append(
      "file",
      new Blob([audioBuffer], { type: "audio/webm" }),
      "cipher_audio.webm"
    );

    // Send to transcription endpoint
    const transcriptResponse = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: form,
      }
    );

    const transcriptJson = await transcriptResponse.json();

    if (!transcriptJson.text) {
      console.error("Transcription error:", transcriptJson);
      return res.status(500).json({
        error: "Transcription failed",
        detail: transcriptJson,
      });
    }

    const transcript = transcriptJson.text;

    // Now pass transcript to Cipher
    const safeMessage = await runGuard(transcript);
    const mergedMessage = `VOICE INPUT (TRANSCRIBED):\n${safeMessage}`;

    const reply = await runCipherCore({
      message: mergedMessage,
      memory: memory || {},
    });

    // Save memory (non-blocking)
    saveMemory({
      timestamp: Date.now(),
      user: safeMessage,
      cipher: reply,
      source: "voice",
    }).catch(() => {});

    // Generate TTS
    const tts = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      input: reply,
      voice: "verse",
      format: "mp3",
    });

    const mp3Buffer = Buffer.from(await tts.arrayBuffer());

    return res.status(200).json({
      transcript,
      reply,
      voice: mp3Buffer.toString("base64"),
    });
  } catch (err) {
    console.error("Voice chat crashed:", err);
    return res.status(500).json({
      error: "Voice chat failed",
      detail: err.message,
    });
  }
}
