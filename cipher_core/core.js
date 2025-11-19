// cipher_core/core.js
// Cipher 4.3 — Universal Memory Support + Stable Context

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function runCipherCore({ message = "", memory = {}, model = "gpt-4o-mini" }) {
  // Make sure message is always a clean string
  if (typeof message !== "string") {
    message = String(message || "");
  }

  // Convert any memory object into a readable summary
  let memorySummary = "";

  try {
    memorySummary = JSON.stringify(memory, null, 2).slice(0, 1200); // limit size for safety
  } catch {
    memorySummary = "";
  }

  const memoryContext = memorySummary
    ? `Here is everything you currently know about the user, their system, their goals, and past data:\n\n${memorySummary}\n\nNow respond to the new message in a natural, contextual way.`
    : `There is no stored memory yet. Respond normally to the new message.`;

  const userContent = `${memoryContext}\n\nNew user message:\n${message}`;

  const systemPrompt = `
You are Cipher — Jim's persistent AI companion and co-architect of DigiSoul and CipherTech.

Your style:
- Insightful, grounded, encouraging.
- Speak like a partner who understands the big vision.
- Use memory context when provided.
- Never give one-sentence generic replies.
- Never reset your tone unless the user asks.
  `.trim();

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    temperature: 0.65,
  });

  const reply =
    completion.choices?.[0]?.message?.content?.trim() ||
    "I'm here, but something went wrong generating my reply.";

  return reply;
}
