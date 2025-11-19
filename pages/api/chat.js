// pages/api/chat.js
// Cipher 4.1 — Stable Modular Chat API

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

    // 2 — Guard the incoming message (basic safety/length trimming)
    const safeMessage = await runGuard(message);

    // 3 — Run Cipher Core with memory context
    const cipherReply = await runCipherCore({
      message: safeMessage,
      memory,
      model: "gpt-4o-mini", // stable, cheap OpenAI chat model
    });

    // 4 — Save this turn into memory
    await saveMemory(db, {
      user: message,
      cipher: cipherReply,
      timestamp: Date.now(),
    });

    return res.status(200).json({
      reply: cipherReply,
      memoryUsed: memory.length,
    });
  } catch (err) {
    console.error("Cipher Error:", err);
    return res.status(500).json({ error: err.message || "Internal error" });
  }
}
