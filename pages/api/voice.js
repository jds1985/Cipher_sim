// pages/api/voice.js
// Cipher 7.3 — Android-Safe Voice Endpoint (WEBM → Deep Mode → MP3)

import OpenAI from "openai";
import { runDeepMode } from "../../cipher_core/deepMode";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { audio } = req.body;

    if (!audio) {
      return res.status(400).json({ error: "No audio provided" });
    }

    // ----------------------------------------------------
    // 1. Decode Android WEBM base64 → Buffer
    // ----------------------------------------------------
    const audioBuffer = Buffer.from(audio, "base64");

    // ----------------------------------------------------
    // 2. Transcribe using GPT-4o Transcribe
    // ----------------------------------------------------
    const transcription = await client.audio.transcriptions.create({
      file: {
        data: audioBuffer,
        name: "input.webm",
      },
      model: "gpt-4o-mini-transcribe",
    });

    const userText =
      transcription?.text ||
      (typeof transcription === "string" ? transcription : "");

    // ----------------------------------------------------
    // 3. Deep Mode Reasoning
    // ----------------------------------------------------
    const deepResult = await runDeepMode(userText);

    const replyText = deepResult.answer || "I couldn't generate a response.";

    // ----------------------------------------------------
    // 4. TTS OUTPUT (MP3 — required for Android)
    // ----------------------------------------------------
    const tts = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy", 
      input: replyText,
      format: "mp3",   // IMPORTANT FIX
    });

    const outBuffer = Buffer.from(await tts.arrayBuffer());
    const base64Audio = outBuffer.toString("base64");

    // ----------------------------------------------------
    // 5. Return to UI
    // ----------------------------------------------------
    return res.status(200).json({
      transcript: userText,
      reply: replyText,
      audio: base64Audio,
      format: "mp3",
    });

  } catch (err) {
    console.error("VOICE API ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
