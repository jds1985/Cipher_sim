// pages/api/voice_chat.js
// Cipher voice endpoint: mic → transcript → Cipher reply → TTS

import OpenAI from "openai";
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

  const { audio, memory } = req.body;

  if (!audio || typeof audio !== "string") {
    return res.status(400).json({ error: "No audio provided" });
  }

  try {
    // 1) Decode base64 → Buffer
    const audioBuffer = Buffer.from(audio, "base64");

    // 2) Send to transcription model
    const transcriptResult = await client.audio.transcriptions.create({
      model: "gpt-4o-mini-transcribe", // or "whisper-1" if you prefer
      file: {
        data: audioBuffer,
        name: "cipher-voice.webm",
      },
      // You can tweak this prompt later if you want him more styled
      prompt: "User is talking to Cipher, their personal AI assistant.",
    });

    const transcript =
      typeof transcriptResult.text === "string"
        ? transcriptResult.text
        : String(transcriptResult.text || "");

    // 3) Run the guard on the transcript
    const safeMessage = await runGuard(transcript);

    // 4) Build merged message for Cipher Core
    const mergedMessage = `VOICE INPUT (TRANSCRIBED):\n${safeMessage}`;

    const reply = await runCipherCore({
      message: mergedMessage,
      memory: memory || [],
    });

    // 5) Save to backend memory log
    try {
      await saveMemory({
        timestamp: Date.now(),
        user: safeMessage,
        cipher: reply,
        source: "voice",
      });
    } catch (err) {
      console.error("saveMemory error:", err);
      // don't fail the whole request if logging breaks
    }

    // 6) Generate TTS reply
    const audioResponse = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "verse",
      input: reply,
      format: "mp3",
    });

    const replyAudioBuffer = Buffer.from(await audioResponse.arrayBuffer());
    const base64ReplyAudio = replyAudioBuffer.toString("base64");

    return res.status(200).json({
      transcript,
      reply,
      voice: base64ReplyAudio,
    });
  } catch (err) {
    console.error("Cipher voice API error:", err);
    return res
      .status(500)
      .json({ error: "Voice processing failed", detail: err.message });
  }
}
