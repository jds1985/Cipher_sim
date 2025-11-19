// pages/api/chat.js
// Cipher 4.0 – Modular Chat API (Thin Wrapper)

import OpenAI from "openai";
import { db } from "../../firebaseAdmin";

// Load the new modular engines
import { runCipherCore } from "../../cipher_core/core";
import { runGuard } from "../../cipher_core/guard";
import { loadMemory, saveMemory } from "../../cipher_core/memory";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Message text required" });
  }

  try {
    // 1. Load current memory snapshot (fast)
    const memory = await loadMemory(db);

    // 2. Run the Guard first (minimal context handler)
    const guardReply = runGuard(message, memory.recentWindow);

    if (guardReply) {
      // update short-term memory
      const reply = guardReply;
      const now = new Date().toISOString();

      memory.recentWindow.push(
        { role: "user", content: message, at: now },
        { role: "assistant", content: reply, at: now }
      );

      memory.recentWindow = memory.recentWindow.slice(-12);

      await saveMemory(db, memory);

      return res.status(200).json({ reply, audio: null });
    }

    // 3. Send the message to the Cipher Core
    const coreOutput = await runCipherCore({
      message,
      memory,
      client,
    });

    const reply = coreOutput.reply;
    const updatedMemory = coreOutput.updatedMemory;

    // 4. Persist new memory snapshot
    await saveMemory(db, updatedMemory);

    // 5. Return result
    return res.status(200).json({
      reply,
      audio: coreOutput.audio || null,
    });
  } catch (err) {
    console.error("Cipher 4.0 API ERROR:", err);
    return res.status(500).json({ error: "Chat generation failed" });
  }
}
