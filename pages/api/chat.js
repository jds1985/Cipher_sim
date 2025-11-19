// pages/api/chat.js
// Cipher 4.0 — Voice + Memory + Stable Output (Playback Helper Embedded)

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
  if (!message) return res.status(400).json({ error: "No message provided" });

  try {
    // 1. Load Cipher's memory
    const memory = await loadMemory();

    // 2. Run guardrails
    const safeMessage = await runGuard(message);

    // 3. Generate Cipher's text response
    const reply = await runCipherCore(safeMessage, memory);

    // 4. Save memory
    const memoryUsed = await saveMemory(message, reply);

    // 5. Generate VOICE
    const audioResponse = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "verse",
      input: reply,
      format: "mp3"
    });

    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
    const base64Audio = audioBuffer.toString("base64");
    const voiceUrl = `data:audio/mp3;base64,${base64Audio}`;


    // 6. Return everything (including embedded helper)
    return res.status(200).json({
      reply,
      voice: base64Audio,
      voiceUrl,
      memoryUsed,

      // 🚀 **You asked to embed the helper directly in chat.js response**
      playVoiceInstructions: `
        // AUTO-PLAY CIPHER VOICE
        if (data.voiceUrl) {
          const audio = new Audio(data.voiceUrl);
          audio.play().catch(err => console.log("Audio play error:", err));
        }
      `
    });

  } catch (err) {
    console.error("Cipher error:", err);
    return res.status(500).json({ error: err.message });
  }
}
