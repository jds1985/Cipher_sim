// pages/api/chat.js
// Cipher 4.1 — Stable Modular Chat API with Voice Output

import OpenAI from "openai";
import { db } from "../../firebaseAdmin";

// Modular Cipher Core
import { runCipherCore } from "../../cipher_core/core";
import { runGuard } from "../../cipher_core/guard";
import { loadMemory, saveMemory } from "../../cipher_core/memory";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Only POST allowed" });
    }

    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message must be text" });
    }

    // 1 — Load recent memory from Firestore
    const memory = await loadMemory(db);

    // 2 — Guard the incoming message
    const safeMessage = await runGuard(message);

    // 3 — Run Cipher Core with memory context
    const cipherReply = await runCipherCore({
      message: safeMessage,
      memory,
      model: "gpt-4o-mini", // Stable, fast, cheap model
    });

    // 4 — Save message + reply to memory
    await saveMemory(db, {
      user: message,
      cipher: cipherReply,
      timestamp: Date.now(),
    });

    // 5 — Generate voice using OpenAI TTS
    let audioBase64 = null;

    try {
      const speech = await client.audio.speech.create({
        model: "gpt-4o-mini-tts",
        voice: "verse",    // Default voice (we can change later)
        input: cipherReply,
      });

      const buffer = Buffer.from(await speech.arrayBuffer());
      audioBase64 = buffer.toString("base64");

    } catch (ttsErr) {
      console.error("TTS generation error:", ttsErr);
    }

    // 6 — Return JSON with text + optional voice
    return res.status(200).json({
      reply: cipherReply,
      voice: audioBase64 ? `data:audio/mp3;base64,${audioBase64}` : null,
      memoryUsed: memory.length,
    });

  } catch (err) {
    console.error("Cipher Error:", err);
    return res.status(500).json({ error: err.message || "Internal error" });
  }
}
