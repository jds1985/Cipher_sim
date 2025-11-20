// pages/api/voice_chat.js
// FINAL FIX — WebM → Whisper using formdata-node (Vercel compatible)

import OpenAI from "openai";
import { runGuard } from "../../cipher_core/guard";
import { runCipherCore } from "../../cipher_core/core";
import { saveMemory } from "../../cipher_core/memory";

import { FormData, File } from "formdata-node";
import { fileFromPath } from "formdata-node/file-from-path";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "30mb",
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

    // Convert base64 → buffer
    const audioBuffer = Buffer.from(audio, "base64");

    // Build server-side multipart form-data
    const form = new FormData();
    form.set("model", "whisper-1");

    const audioFile = new File([audioBuffer], "cipher_audio.webm", {
      type: "audio/webm",
    });

    form.set("file", audioFile);

    // Send real file upload to OpenAI
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

    // run guard + core
    const safeMessage = await runGuard(transcript);
    const reply = await runCipherCore({
      message: safeMessage,
      memory: memory || {},
    });

    // save memory
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
