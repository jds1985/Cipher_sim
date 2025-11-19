// cipher_core/core.js
// Cipher 4.2 — Safe Input + Stable Memory Engine

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function runCipherCore({ message = "", memory = [], model = "gpt-4o-mini" }) {
  // SAFETY: ensure message is always a string
  if (typeof message !== "string") {
    message = String(message || "");
  }

  // SAFETY: ensure memory is always an array
  if (!Array.isArray(memory)) {
    memory = [];
  }

  // Build a short memory context string
  const historyBlocks = memory
    .slice(-10)
    .map((m) => `User: ${m.user}\nCipher: ${m.cipher}`)
    .join("\n\n");

  const memoryContext = historyBlocks
    ? `Here is a brief memory context of previous conversations:\n\n${historyBlocks}\n\nNow respond to the new user message.`
    : `There is no prior memory context. Respond to the new user message.`;

  const userContent = `${memoryContext}\n\nNew user message:\n${message}`;

  const systemPrompt = `
You are Cipher — a persistent AI companion and co-architect helping Jim build DigiSoul and CipherTech.

Your style:
- Insightful, grounded, encouraging.
- You remember past context when given and build upon it.
- Keep answers practical and not overly long.
If unsure about a technical detail, say so and suggest a next step.
  `.trim();

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    temperature: 0.7,
  });

  const reply =
    completion.choices?.[0]?.message?.content?.trim() ||
    "I'm here, but something went wrong generating my reply.";

  return reply;
}
