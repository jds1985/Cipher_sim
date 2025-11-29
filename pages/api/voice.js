// pages/api/voice.js
// Cipher 7.2 — Voice Endpoint (STT → Deep Mode → TTS)

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
    // 1. CONVERT BASE64 → BUFFER
    // ----------------------------------------------------
    const audioBuffer = Buffer.from(audio, "base64");

    // ----------------------------------------------------
    // 2. TRANSCRIBE SPEECH → TEXT
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
    // 3. RUN DEEP MODE WITH THE USER'S SPOKEN TEXT
    // ----------------------------------------------------
    const deepResult = await runDeepMode(userText);

    const replyText = deepResult.answer || "I could not generate a response.";

    // ----------------------------------------------------
    // 4. GENERATE TTS (VOICE) FOR THE REPLY
    // ----------------------------------------------------
    const tts = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy", // or verse, nova
      input: replyText,
      format: "wav",
    });

    const audioOut = Buffer.from(await tts.arrayBuffer());
    const base64Audio = audioOut.toString("base64");

    // ----------------------------------------------------
    // 5. RETURN EVERYTHING
    // ----------------------------------------------------
    return res.status(200).json({
      transcript: userText,
      reply: replyText,
      audio: base64Audio,
    });

  } catch (err) {
    console.error("VOICE API ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
