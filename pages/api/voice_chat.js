// pages/api/voice_chat.js
// Cipher Voice Route — FINAL FIX (Base64 → OpenAI Audio Messages)

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

  try {
    const { audio, memory } = req.body;

    if (!audio) {
      return res.status(400).json({ error: "Missing audio base64." });
    }

    // ---------------------------------------------------
    // 1) Whisper via NEW GPT-4o Audio Input Format
    // ---------------------------------------------------
    const whisperResp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "input_audio",
              input_audio: {
                data: audio,       // base64
                format: "webm",    // matches your MediaRecorder output
              },
            },
            {
              type: "text",
              text: "Transcribe this audio.",
            },
          ],
        },
      ],
    });

    const transcript = whisperResp.choices?.[0]?.message?.content?.[0]?.text || "";

    // ---------------------------------------------------
    // 2) Guard + Core
    // ---------------------------------------------------
    const safeTranscript = await runGuard(
      transcript.trim() || "[user sent empty voice input]"
    );

    const coreReply = await runCipherCore({
      message: safeTranscript,
      memory: memory || {},
    });

    // ---------------------------------------------------
    // 3) Save memory
    // ---------------------------------------------------
    await saveMemory({
      timestamp: Date.now(),
      user: safeTranscript,
      cipher: coreReply,
    });

    // ---------------------------------------------------
    // 4) Text → Speech (TTS)
    // ---------------------------------------------------
    const ttsResp = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "verse",
      input: coreReply,
      format: "mp3",
    });

    const ttsBuffer = Buffer.from(await ttsResp.arrayBuffer());
    const voiceBase64 = ttsBuffer.toString("base64");

    // ---------------------------------------------------
    // 5) Return final response
    // ---------------------------------------------------
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
