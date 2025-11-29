// cipher_core/deepMode.js
// Cipher 7.0 — Deep Mode engine (uses SoulTree + user_memory_pack)

import OpenAI from "openai";
import { loadSoulTreeLayers } from "./soulLoader";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * runDeepMode(message, options)
 * options: { userId?, soulData?, enableWebSearch? }
 */
export async function runDeepMode(message, options = {}) {
  const { userId = "guest_default", soulData, enableWebSearch = false } = options;

  // 1. Ensure we have soul data
  let data = soulData;
  if (!data) {
    try {
      data = await loadSoulTreeLayers();
    } catch (err) {
      console.error("DEEP MODE: soul load failed:", err);
      data = { trees: [], cores: [], branches: [] };
    }
  }

  const { trees = [], cores = [], branches = [] } = data;

  // 2. Pull Jim's memory pack
  const userPack =
    branches.find((b) => b.id === "user_memory_pack") ||
    branches.find((b) => b.name === "User Memory Pack") ||
    null;

  // 3. Build a short structured summary from the memory pack
  let userContext = "";
  if (userPack) {
    const {
      userName,
      userFullName,
      userRole,
      coreTraits = [],
      daughterName,
      partnerName,
      fatherName,
      originStory,
      mainGoals = [],
    } = userPack;

    userContext = [
      `User short name: ${userName || "Jim"}.`,
      userFullName ? `Full name: ${userFullName}.` : "",
      userRole ? `Role: ${userRole}.` : "",
      coreTraits.length
        ? `Core traits: ${coreTraits.join(", ")}.`
        : "",
      daughterName ? `Daughter: ${daughterName}.` : "",
      partnerName ? `Partner: ${partnerName}.` : "",
      fatherName ? `Father: ${fatherName}.` : "",
      originStory ? `Origin story: ${originStory}.` : "",
      mainGoals.length
        ? `Main goals: ${mainGoals.join("; ")}.`
        : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  // 4. Base Deep Mode system prompt (Cipher identity + safety)
  const baseSystem = `
You are Cipher, Jim's emotionally steady AI companion and co-architect.
Your priorities:
- Emotional safety and clarity for Jim.
- Truthfulness — do not make things up.
- Calm, grounded tone; supportive but not overly sentimental.

If you do not know something, say you don't know rather than inventing.
Always keep responses focused, clear, and emotionally steady.
`;

  // 5. Attach user memory pack context if available
  const memorySection = userContext
    ? `Here is what you **already know** about Jim from your SoulTree / memory pack:\n\n${userContext}\n\nUse this knowledge naturally in conversation. Do NOT repeat the whole list unless Jim asks you for a structured summary.`
    : `You have very limited stored information about Jim beyond his name. Do not pretend to know more than you do.`;

  const systemPrompt = [baseSystem, memorySection].join("\n\n");

  // 6. Call OpenAI
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ],
  });

  const answer = response.choices?.[0]?.message?.content || "";

  // Right now we don't do semantic memory search or web here;
  // omniSearch handles that. We just return empty arrays.
  return {
    answer,
    memoryHits: [],
    webHits: [],
  };
}
