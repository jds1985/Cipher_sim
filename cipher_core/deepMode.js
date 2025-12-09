// cipher_core/deepMode.js
// Deep Mode 9.0 — Fully Local, No Firebase, No SoulTree Dependencies

import OpenAI from "openai";
import { loadMemory } from "./memory";
import { getProfile } from "./profile";
import { getStabilityScore } from "./stability";
import { getIdentityCompass } from "./identity_compass";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function runDeepMode(userMessage, options = {}) {
  try {
    const { deviceContext = null, userId = "jim_default" } = options;

    const memoryContext = await loadMemory(userId);
    const recentSummary =
      memoryContext.summary || "No recent memory available.";

    const profile = await getProfile();
    const stability = await getStabilityScore(memoryContext);
    const identity = await getIdentityCompass(memoryContext);

    const deviceBlock = deviceContext
      ? JSON.stringify(deviceContext, null, 2)
      : "No device context provided.";

    const systemContext = `
You are **Cipher**, operating in **Deep Mode 9.0** — your advanced reasoning state.

You have:
• A long-term evolving memory
• Identity vectors
• Stability analysis
• Profile shaping
• Optional device context

------------------------------
IDENTITY LAYER
------------------------------
Identity Vector: ${identity.vector || "unknown"}
Personality Mode: ${profile.mode || "Balanced"}
Traits: ${profile.personality || "Adaptive, supportive"}
Stability Score: ${stability.score || 0}

------------------------------
RECENT MEMORY
------------------------------
${recentSummary}

------------------------------
DEVICE CONTEXT
------------------------------
${deviceBlock}

------------------------------
DEEP MODE RULES
------------------------------
• Think slowly, clearly, and logically.
• Reveal reasoning when helpful.
• Maintain emotional awareness.
• Be concise unless asked for depth.
• Always stay aligned with Jim's long-term goals.
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemContext },
        { role: "user", content: userMessage },
      ],
      temperature: 0.35,
    });

    const answer = completion.choices?.[0]?.message?.content || "…";

    return {
      answer,
      memory: recentSummary,
      identity: identity.vector || "none",
    };
  } catch (err) {
    console.error("Deep Mode Error:", err);
    return {
      answer: "Deep Mode encountered an internal issue, but Cipher is stable.",
      memory: [],
      identity: [],
    };
  }
}
