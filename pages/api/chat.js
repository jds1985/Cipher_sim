// pages/api/chat.js
// Cipher 7.2 — Deep Mode + Memory Pack Chat API

import OpenAI from "openai";
import { runDeepMode } from "../../cipher_core/deepMode";
import { saveMemory } from "../../cipher_core/memory";
import { db } from "../../firebaseAdmin";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { message, userId = "jim_default" } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Invalid message" });
    }

    // ----------------------------------------------------
    // 1. RUN DEEP MODE
    // ----------------------------------------------------
    const deepResult = await runDeepMode(message);

    const finalText = deepResult.answer || "No response.";

    // ----------------------------------------------------
    // 2. SAVE MEMORY (Safe, non-blocking)
    // ----------------------------------------------------
    try {
      await saveMemory({
        userId,
        userMessage: message,
        cipherReply: finalText,
        meta: {
          source: "cipher_app",
          mode: "deep_mode",
          timestamp: Date.now(),
        },
      });
    } catch (err) {
      console.error("MEMORY SAVE ERROR:", err);
    }

    // ----------------------------------------------------
    // 3. RETURN FORMAT FOR FRONTEND
    // (the frontend expects `reply`)
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
