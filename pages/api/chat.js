// pages/api/chat.js
// Cipher 4.0 — Memory + Voice + Guard + Stable Output

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

  const { message } = req.body;
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "No message provided" });
  }

  try {
    // 1. Load memory
    const memory = await loadMemory();

    // 2. Guard rails
    const safeMessage = await runGuard(message);

    // 3. Cipher core reasoning
    const reply = await runCipherCore(safeMessage, memory);

    // 4. Save memory
    const memoryUsed = await saveMemory(message, reply);

    // 5. Generate voice response (returns raw mp3 bytes)
    const audioResponse = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "verse",    // change this later if you want another voice
      input: reply,
      format: "mp3"
    });

    // Convert to Base64 for the browser
    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
    const base64Audio = audioBuffer.toString("base64");

    // 6. Send result (IMPORTANT: return audio: not voice:)
    return res.status(200).json({
      reply,
      audio: base64Audio,   // <-- NOW MATCHES FRONTEND EXACTLY
      memoryUsed
    });

  } catch (err) {
    console.error("Cipher error:", err);
    return res.status(500).json({ error: err.message });
  }
}
