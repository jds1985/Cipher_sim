// pages/api/chat.js
// Cipher 4.3 — Memory + Voice + Correct Argument Passing

import OpenAI from "openai";
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

  const { message, memory } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "No message provided" });
  }

  try {
    // 1. Guard
    const safeMessage = await runGuard(message);

    // 2. Load server memory (not required for front-end memory but still used)
    const serverMemory = await loadMemory();

    // 3. RUN CIPHER CORE (FIXED ARGUMENT SHAPE)
    const reply = await runCipherCore({
      message: safeMessage,
      memory: memory || [],
    });

    // 4. Save backend memory
    const memoryUsed = await saveMemory(message, reply);

    // 5. Generate TTS voice
    const audioResponse = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "verse",
      input: reply,
      format: "mp3",
    });

    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
    const base64Audio = audioBuffer.toString("base64");

    // 6. Send result
    return res.status(200).json({
      reply,
      voice: base64Audio,
      memoryUsed,
    });

  } catch (err) {
    console.error("Cipher API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
