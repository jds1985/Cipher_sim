// pages/api/chat.js
// Cipher Chat – Upgraded to GPT-5.1

import OpenAI from "openai";
import { db } from "../../firebaseAdmin";

// Cipher engines
import { runCipherCore } from "../../cipher_core/core";
import { runGuard } from "../../cipher_core/guard";
import { loadMemory, saveMemory } from "../../cipher_core/memory";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Invalid message" });
    }

    // 1) Load existing memory (you already have this module)
    const memoryContext = await loadMemory();

    // 2) Guardrails
    const guardResult = await runGuard(message);
    if (guardResult?.flagged) {
      return res
        .status(400)
        .json({ error: "Message flagged by safety guardrails." });
    }

    // 3) Build Cipher's system prompt from SoulTree + memory
    const systemPrompt = await runCipherCore(memoryContext);

    // 4) GPT-5.1 main reasoning call
    const completion = await client.chat.completions.create({
      model: "gpt-5.1",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    const reply = completion.choices[0]?.message?.content || "";

    // 5) Save new exchange to your memory system
    await saveMemory(message, reply);

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Cipher chat error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
