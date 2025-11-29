// pages/api/chat.js
// Cipher 7.0 — Deep Mode Chat API

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

    const { message, userId = "guest_default" } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Invalid message" });
    }

    // ----------------------------------------------------
    // 1. RUN DEEP MODE
    // ----------------------------------------------------
    const deepResult = await runDeepMode(message);

    // ----------------------------------------------------
    // 2. SAVE MEMORY HIT (Cipher's reply + user message)
    // ----------------------------------------------------
    try {
      await saveMemory({
        userId,
        userMessage: message,
        cipherReply: deepResult.answer,
        meta: {
          source: "cipher_app",
          mode: "chat",
          timestamp: Date.now(),
        },
      });
    } catch (err) {
      console.error("MEMORY SAVE ERROR:", err);
      // Do NOT block the user — memory errors should be silent
    }

    // ----------------------------------------------------
    // 3. RETURN FULL DEEP MODE RESULT
    // ----------------------------------------------------
    return res.status(200).json({
      ok: true,
      answer: deepResult.answer,
      memoryHits: deepResult.memoryHits || [],
      webHits: deepResult.webHits || [],
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
