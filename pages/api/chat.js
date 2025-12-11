// pages/api/chat.js
// Cipher Chat API — Core 10.0 (Stable)

import OpenAI from "openai";
import { loadMemory, saveMemory } from "../../cipher_core/memory";
import { runCipherCore } from "../../cipher_core/core";
import { runGuard } from "../../cipher_core/guard";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, userId } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Invalid message" });
    }

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ error: "Missing userId" });
    }

    // 1) LOAD MEMORY
    const memoryContext = await loadMemory(userId);

    // 2) GUARDRAILS
    const guard = await runGuard(message);

    if (guard.flagged) {
      return res.status(400).json({
        error: "Message blocked by safety filter.",
        reason: guard.reason || "Unknown",
      });
    }

    const cleanedMessage = guard.cleaned || message;

    // 3) SYSTEM PROMPT
    const systemPrompt = await runCipherCore(memoryContext);

    // 4) GPT CALL
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: cleanedMessage },
      ],
    });

    const reply =
      completion.choices?.[0]?.message?.content ||
      "Cipher is thinking…";

    // 5) SAVE MEMORY
    await saveMemory({
      userId,
      userMessage: cleanedMessage,
      cipherReply: reply,
      meta: { source: "chat_api" },
    });

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Cipher /api/chat error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
