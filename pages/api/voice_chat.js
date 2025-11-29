// pages/api/voice_chat.js
// Cipher 7.3 — Whisper STT → Deep Mode → Human-Paced Verse Voice

import OpenAI from "openai";
import { runDeepMode } from "../../cipher_core/deepMode";
import { saveMemory } from "../../cipher_core/memory";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Human pacing helper
function humanizeSpeech(text) {
  return `
<speak>
  <prosody rate="92%">
    <break time="250ms"/>
    ${text
      .replace(/\./g, ".<break time='220ms'/>")
      .replace(/,/g, ",<break time='140ms'/>")
      .replace(/…/g, "<break time='280ms'/>")}
  </prosody>
</speak>
`;
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { audio } = req.body;

    if (!audio) {
      return res.status(400).json({ error: "Missing audio data" });
    }

    // Convert base64 → buffer → blob → file
    const buffer = Buffer.from(audio, "base64");
    const blob = new Blob([buffer], { type: "audio/webm" });
    const file = new File([blob], "voice.webm", { type: "audio/webm" });

    // 1. Transcribe voice
    const transcription = await client.audio.transcriptions.create({
      file,
      model: "gpt-4o-transcribe",
    });

    const text =
      transcription?.text ||
      (typeof transcription === "string" ? transcription : "");

    // 2. Deep Mode reasoning
    const deepResult = await runDeepMode(text);
    const reply = deepResult.answer;

    // 3. Save memory
    await saveMemory({
      userMessage: text,
      cipherReply: reply,
      timestamp: Date.now(),
      meta: { mode: "voice" },
    });

    // 4. TTS human-paced
    const tts = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "verse",
      input: humanizeSpeech(reply),
      format: "mp3",
    });

    const audioBase64 = Buffer.from(await tts.arrayBuffer()).toString("base64");

    return res.status(200).json({
      ok: true,
      transcript: text,
      reply,
      voice: audioBase64,
    });
  } catch (err) {
    console.error("VOICE_CHAT ERROR:", err);
    return res.status(500).json({ error: "Voice Chat Failed", details: err+"" });
  }
}
