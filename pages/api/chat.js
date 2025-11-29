// pages/api/chat.js
// Cipher 7.0 — Deep Mode Chat API (Unified Memory + SoulTree + Memory Pack)

import OpenAI from "openai";
import { runDeepMode } from "../../cipher_core/deepMode";
import { saveMemory } from "../../cipher_core/memory";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  try {
    // ------------------------------------------
    // VALIDATE METHOD
    // ------------------------------------------
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // ------------------------------------------
    // EXTRACT INPUT
    // ------------------------------------------
    const { message, userId = "guest_default" } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Invalid or missing message." });
    }

    // ------------------------------------------
    // 1. RUN DEEP MODE (primary brain)
    // ------------------------------------------
    const deep = await runDeepMode(message, userId);

    if (!deep.ok) {
      console.error("Deep Mode Failure:", deep.error);
    }

    const reply = deep.answer || "I'm here, Jim — something glitched.";

    // ------------------------------------------
    // 2. SAVE MEMORY EVENT
    // ------------------------------------------
    try {
      await saveMemory({
        userId,
        userMessage: message,
        cipherReply: reply,
        meta: {
          mode: "deep_chat",
          source: "cipher_app",
          timestamp: Date.now(),
        },
      });
    } catch (memErr) {
      console.error("MEMORY SAVE ERROR:", memErr);
      // Do not block — memory save failure should be silent
    }

    // ------------------------------------------
    // 3. RETURN TO FRONTEND
    // ------------------------------------------
    return res.status(200).json({
      ok: true,
      answer: reply,
      memoryUsed: deep.contextUsed || {},
      memoryHits: deep.memoryHits || [],
      webHits: deep.webHits || [],
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
