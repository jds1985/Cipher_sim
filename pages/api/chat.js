// pages/api/chat.js
// CIPHER 10.0 — Autonomous Reasoning Pipeline

import OpenAI from "openai";
import { runCipherCore } from "../../cipher_core/core";
import { loadMemory, saveMemory } from "../../cipher_core/memory";
import { runGuard } from "../../cipher_core/guard";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, userId } = req.body;
  if (!message || !userId) {
    return res.status(400).json({ error: "Missing message or userId" });
  }

  try {
    // ---------------------------------------------------
    // 1. LOAD MEMORY CONTEXT
    // ---------------------------------------------------
    const memoryContext = await loadMemory(userId);

    // ---------------------------------------------------
    // 2. CIPHER AUTONOMOUS CORE (profile + stability + identity)
    // ---------------------------------------------------
    const cipherBrain = await runCipherCore(memoryContext, {
      userMessage: message
    });

    // ---------------------------------------------------
    // 3. GUARD RAILS (safety + tone + alignment)
    // ---------------------------------------------------
    const systemGuard = runGuard(cipherBrain);

    // ---------------------------------------------------
    // 4. GENERATE RESPONSE w/ GPT-4o-mini
    // ---------------------------------------------------
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemGuard },
        { role: "user", content: message },
      ],
    });

    const reply = completion.choices?.[0]?.message?.content || "Cipher is thinking…";

    // ---------------------------------------------------
    // 5. SAVE MEMORY
    // ---------------------------------------------------
    await saveMemory(userId, {
      user: message,
      assistant: reply,
      ts: Date.now()
    });

    return res.status(200).json({ reply });
  } catch (e) {
    console.error("CIPHER ERROR:", e);
    return res.status(500).json({ reply: "Cipher encountered an internal error." });
  }
}
