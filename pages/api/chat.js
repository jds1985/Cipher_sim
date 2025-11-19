// pages/api/chat.js
// Cipher 4.2 — Stable Memory + Voice + Guard + Core Link

import OpenAI from "openai";
import { db } from "../../firebaseAdmin";
import { loadMemory, saveMemory } from "../../cipher_core/memory";
import { runGuard } from "../../cipher_core/guard";
import { runCipherCore } from "../../cipher_core/core";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Invalid message" });
    }

    // 1. Load memory from Firebase
    const memory = await loadMemory();

    // 2. Clean the message
    const safeMessage = await runGuard(message);

    // 3. Run Cipher Core with proper shape
    const reply = await runCipherCore({
      message: safeMessage,
      memory: memory || [],
    });

    // 4. Save memory for future sessions
    const memoryUsed = await saveMemory(message, reply);

    // 5. Create voice output (TTS)
    const voiceOut = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "verse",
      input: reply,
      format: "mp3",
    });

    const voiceBuffer = Buffer.from(await voiceOut.arrayBuffer());
    const base64Voice = voiceBuffer.toString("base64");

    // 6. Send response to frontend
    return res.status(200).json({
      reply,
      voice: base64Voice,   // <— FRONTEND WILL USE THIS
      memoryUsed,
    });
  } catch (err) {
    console.error("Cipher API Error:", err);
    return res.status(500).json({
      error: "Cipher crashed internally.",
      details: err.message,
    });
  }
}
