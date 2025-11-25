// pages/api/voice_chat.js

import OpenAI from "openai";
import { loadMemory, saveMemory } from "../../cipher_core/memory";

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
      return res.status(400).json({ error: "No audio provided" });
    }

    // 1. Transcribe
    const transcriptRes = await client.audio.transcriptions.create({
      file: audio,
      model: "gpt-4o-transcribe",
    });

    const transcript = transcriptRes.text || "(silent audio)";

    // 2. Chat response
    const chatRes = await client.responses.create({
      model: "gpt-4o-mini",
      input: transcript,
    });

    const reply = chatRes.output_text;

    await saveMemory(transcript, reply);

    // 3. Voice output
    const voiceRes = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: reply,
      format: "mp3",
    });

    res.json({
      transcript,
      reply,
      voice: voiceRes.base64,
    });

  } catch (err) {
    console.error("VOICE ERROR:", err);
    res.status(500).json({ error: "Voice failure", details: err.message });
  }
}
