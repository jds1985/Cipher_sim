// pages/api/chat.js
// Cipher 8.0 — Deep Mode + SoulTree Memory Chat API

import { runDeepMode } from "../../cipher_core/deepMode";
import { saveMemory } from "../../cipher_core/memory";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const {
      message,
      userId = "jim_default",
      deviceContext = null,
    } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Invalid message" });
    }

    // ----------------------------------------------------
    // 1. RUN DEEP MODE WITH SOULTREE 8.0
    // ----------------------------------------------------
    const deepResult = await runDeepMode(message, {
      userId,
      deviceContext,
    });

    const finalText = deepResult.answer || "No response.";

    // ----------------------------------------------------
    // 2. SAVE MEMORY (fire-and-forget)
    // ----------------------------------------------------
    saveMemory({
      userId,
      userMessage: message,
      cipherReply: finalText,
      deviceContext,
      meta: {
        source: "cipher_app",
        mode: "deep_mode_chat",
        timestamp: Date.now(),
      },
    }).catch((err) => {
      console.error("MEMORY SAVE ERROR:", err);
    });

    // ----------------------------------------------------
    // 3. RESPOND TO FRONTEND
    // ----------------------------------------------------
    return res.status(200).json({
      ok: true,
      reply: finalText,
      memoryHits: deepResult.memoryHits,
      soulHits: deepResult.soulHits,
    });
  } catch (err) {
    console.error("CHAT API ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: "Cipher encountered an internal error.",
      details: String(err),
    });
  }
}
