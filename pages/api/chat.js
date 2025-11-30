// pages/api/chat.js
// Cipher 7.3 — Deep Mode + Memory Pack + Device Context + TTS

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

    const {
      message,
      userId = "jim_default",
      memory,
      deviceContext,
    } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Invalid message" });
    }

    // ----------------------------------------------------
    // 1. ENRICH MESSAGE WITH SOFT DEVICE CONTEXT (MODE A)
    // ----------------------------------------------------
    let enrichedMessage = message;

    if (deviceContext) {
      let safeCtx = "";
      try {
        safeCtx = JSON.stringify(deviceContext);
        if (safeCtx.length > 2000) {
          safeCtx = safeCtx.slice(0, 2000) + "...(truncated)";
        }
      } catch {
        safeCtx = "[unserializable device context]";
      }

      enrichedMessage =
        `You are Cipher, Jim's AI companion. ` +
        `You are given some JSON about his current device state. ` +
        `Use it ONLY for subtle context (e.g., battery, network, performance) ` +
        `or if Jim directly asks about his device. ` +
        `Do NOT dump the JSON or talk about 'deviceContext' explicitly.\n\n` +
        `DEVICE_CONTEXT_JSON:\n${safeCtx}\n\n` +
        `USER_MESSAGE:\n${message}`;
    }

    // ----------------------------------------------------
    // 2. RUN DEEP MODE
    // ----------------------------------------------------
    const deepResult = await runDeepMode(enrichedMessage, {
      memory: memory || null,
      deviceContext: deviceContext || null,
    });

    const finalText =
      (deepResult && (deepResult.answer || deepResult.reply)) ||
      "No response.";

    // ----------------------------------------------------
    // 3. SAVE MEMORY (NON-BLOCKING)
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
          deviceContextSummary: deviceContext ? "included" : "none",
        },
      });
    } catch (err) {
      console.error("MEMORY SAVE ERROR:", err);
    }

    // ----------------------------------------------------
    // 4. GENERATE TTS (VERSE) FOR TEXT CHAT
    // ----------------------------------------------------
    let voiceBase64 = null;
    try {
      const tts = await client.audio.speech.create({
        model: "gpt-4o-mini-tts",
        voice: "verse", // human-like pacing you liked
        input: finalText,
        format: "mp3",
      });

      const buf = Buffer.from(await tts.arrayBuffer());
      voiceBase64 = buf.toString("base64");
    } catch (err) {
      console.error("TTS ERROR (chat):", err);
    }

    // ----------------------------------------------------
    // 5. RETURN FORMAT FOR FRONTEND
    // ----------------------------------------------------
    return res.status(200).json({
      ok: true,
      reply: finalText,
      voice: voiceBase64, // <-- frontend already plays this if present
      memoryHits: deepResult?.memoryHits || [],
      soulHits: deepResult?.soulHits || [],
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
