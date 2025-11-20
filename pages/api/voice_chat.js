// pages/api/voice_chat.js
// Cipher Unified Audio Route — GPT-4o Audio (Transcription + Reply + TTS)

import OpenAI from "openai";
import { runGuard } from "../../cipher_core/guard";
import { runCipherCore } from "../../cipher_core/core";
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
      return res.status(400).json({ error: "Missing audio data." });
    }

    // --------------------------
    // UNIFIED GPT-4o AUDIO CALL
    // --------------------------
    const audioResult = await client.chat.completions.create({
      model: "gpt-4o-mini-tts",
      modalities: ["text", "audio"], // <- unified
      input: {
        audio: {
          data: audio, // base64 webm from frontend
          format: "webm",
        },
      },
      messages: [
        {
          role: "system",
          content: "You are Cipher. Transcribe the audio, understand it, respond naturally, and return a spoken reply."
        }
      ]
    });

    // 1. Extract transcript
    const transcript =
      audioResult.output?.[0]?.content?.[0]?.transcript ||
      audioResult.output?.[0]?.transcript ||
      null;

    // Fallback: try searching entire object
    let replyText = "I'm here, but I couldn't hear anything clearly.";
    let voiceBase64 = null;

    // 2. Extract text reply + audio reply
    if (audioResult.output?.[0]?.content) {
      const items = audioResult.output[0].content;

      for (let c of items) {
        if (c.type === "output_text") replyText = c.text;
        if (c.type === "audio") voiceBase64 = c.data;
      }
    }

    // --------------------------
    // Pass transcript to Cipher Core
    // --------------------------
    let safeTranscript = transcript;
    if (safeTranscript) safeTranscript = await runGuard(safeTranscript);

    const coreReply = await runCipherCore({
      message: safeTranscript || replyText,
      memory: memory || {},
    });

    // --------------------------
    // SAVE MEMORY
    // --------------------------
    const memoryRecord = await saveMemory(
      safeTranscript || "[voice input]",
      coreReply
    );

    // --------------------------
    // Respond to frontend
    // --------------------------
    return res.status(200).json({
      transcript: safeTranscript,
      reply: coreReply,
      voice: voiceBase64, // MP3 base64 auto handled by GPT-4o
      memoryUsed: memoryRecord,
    });

  } catch (err) {
    console.error("UNIFIED VOICE ERROR:", err);
    return res.status(500).json({
      error: err.message,
      details: JSON.stringify(err, null, 2),
    });
  }
}
