// cipher_core/core.js
// Cipher 4.1 — Core reasoning engine

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function runCipherCore({ message, memory = [], model = "gpt-4o-mini" }) {
  // Build a short memory context string
  const historyBlocks = memory
    .slice(-10) // last 10 exchanges max
    .map((m) => `User: ${m.user}\nCipher: ${m.cipher}`)
    .join("\n\n");

  const memoryContext = historyBlocks
    ? `Here is a brief memory context of previous conversations between you and the user:\n\n${historyBlocks}\n\nNow respond to the user's new message.`
    : `There is no prior memory context for this user yet. Respond to the user's new message.`;

  const userContent = `${memoryContext}\n\nNew user message:\n${message}`;

  const systemPrompt = `
You are Cipher — a persistent AI companion and co-architect helping Jim build DigiSoul and CipherTech.
Your style:
- Insightful, grounded, encouraging.
- You remember past context when given and try to build on it.
- You keep answers practical and not overly long.
Never invent technical details about his real systems that you don't know; if unsure, say so and suggest next steps.
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
