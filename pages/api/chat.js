// pages/api/chat.js
// Cipher 7.1 — Deep Mode Unified Chat API

import OpenAI from "openai";
import { runDeepMode } from "../../cipher_core/deepMode";
import { saveMemory } from "../../cipher_core/memory";

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
      return res.status(400).json({ error: "Invalid message format" });
    }

    // ----------------------------------------------------
    // 1. RUN DEEP MODE 7.1
    // ----------------------------------------------------
    let deepResult;
    try {
      deepResult = await runDeepMode(message);
    } catch (err) {
      console.error("Deep Mode Failure:", err);
      throw new Error("Deep Mode failed internally.");
    }

    // ----------------------------------------------------
    // 2. SAVE MEMORY ENTRY (non-blocking)
    // ----------------------------------------------------
    try {
      await saveMemory({
        userId,
        userMessage: message,
        cipherReply: deepResult.answer,
        meta: {
          source: "cipher_app",
          mode: "deep_chat",
          timestamp: Date.now(),
        },
      });
    } catch (err) {
      // Never block the user if Firestore save fails
      console.error("Memory Save Error:", err);
    }

    // ----------------------------------------------------
    // 3. RETURN DEEP MODE DATA TO UI
    // ----------------------------------------------------
    return res.status(200).json({
      ok: true,
      answer: deepResult.answer,
      memoryHits: deepResult.memoryHits || [],
      soulHits: deepResult.soulHits || [],
    });

  } catch (err) {
    console.error("CHAT API ERROR:", err);

    return res.status(500).json({
      ok: false,
      error: "Cipher encountered an internal error.",
      details: err.message,
    });
  }
}
