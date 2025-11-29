// pages/api/chat.js
// Cipher 7.0 — Full Deep Mode Chat API (Memory Pack + Soul Tree + Safety)

import OpenAI from "openai";
import { runDeepMode } from "../../cipher_core/deepMode";
import { saveMemory } from "../../cipher_core/memory";
import { loadSoulTreeLayers } from "../../cipher_core/soulLoader";
import { db } from "../../firebaseAdmin";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { message, userId = "guest_default", web = false } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Invalid message" });
    }

    // ----------------------------------------------------
    // 1. LOAD SOUL TREE + MEMORY PACKS
    // ----------------------------------------------------
    let soulData;
    try {
      soulData = await loadSoulTreeLayers();
    } catch (err) {
      console.error("SOUL LOAD ERROR:", err);
      soulData = { trees: [], cores: [], branches: [] };
    }

    // ----------------------------------------------------
    // 2. RUN DEEP MODE ENGINE
    // ----------------------------------------------------
    const deepResult = await runDeepMode(message, {
      userId,
      soulData,
      enableWebSearch: web, // optional
    });

    // ----------------------------------------------------
    // 3. SAVE MEMORY (non-blocking)
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
      console.error("MEMORY SAVE ERROR:", err); // silent fail
    }

    // ----------------------------------------------------
    // 4. SEND FULL RESPONSE TO CLIENT
    // ----------------------------------------------------
    return res.status(200).json({
      ok: true,
      answer: deepResult.answer,
      memoryHits: deepResult.memoryHits || [],
      soulUsed: soulData || null,
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
