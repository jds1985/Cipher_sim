// pages/api/chat.js
// Cipher 4.0 HYBRID — Unified API Handler
// Uses modular core/guard/memory system

import OpenAI from "openai";
import { db } from "../../firebaseAdmin";

// NEW: Modular Cipher Core System
import { buildSystemPrompt } from "../../cipher_core/core";
import { applyMinimalGuard } from "../../cipher_core/guard";
import {
  loadCipherMemory,
  updateCipherMemory,
  pushConversationWindow
} from "../../cipher_core/memory";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
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
    // -------------------------------------------------------
    // LOAD MEMORY (long-term + short-term)
    // -------------------------------------------------------
    const mem = await loadCipherMemory(db);

    // -------------------------------------------------------
    // MINIMAL GUARD (intercepts: “what was I just talking about?”)
    // -------------------------------------------------------
    const guardResponse = applyMinimalGuard(message, mem);
    if (guardResponse) {
      await pushConversationWindow(db, message, guardResponse);

      return res.status(200).json({
        reply: guardResponse,
        audio: await tts(guardResponse)
      });
    }

    // -------------------------------------------------------
    // BUILD SYSTEM PROMPT (via modular core.js)
    // -------------------------------------------------------
    const systemPrompt = buildSystemPrompt(mem);

    // -------------------------------------------------------
    // LLM CALL
    // -------------------------------------------------------
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ]
    });

    const reply =
      completion.choices?.[0]?.message?.content ||
      "I'm here with you, Jim.";

    // -------------------------------------------------------
    // MEMORY EXTRACTION + UPDATE
    // -------------------------------------------------------
    await updateCipherMemory(db, message, reply);

    // -------------------------------------------------------
    // SHORT-TERM UPDATE (recentWindow)
    // -------------------------------------------------------
    await pushConversationWindow(db, message, reply);

    // -------------------------------------------------------
    // OPTIONAL AUDIO
    // -------------------------------------------------------
    const audio = await tts(reply);

    return res.status(200).json({ reply, audio });
  } catch (err) {
    console.error("Cipher 4.0 API Error:", err);
    return res.status(500).json({ error: "Chat generation failed" });
  }
}

// -----------------------------------------------------------
// TEXT → SPEECH
// -----------------------------------------------------------
async function tts(text) {
  try {
    const speech = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "verse",
      input: text,
      format: "mp3"
    });

    return Buffer.from(await speech.arrayBuffer()).toString("base64");
  } catch (err) {
    console.error("TTS error (non-fatal):", err.message);
    return null;
  }
}
