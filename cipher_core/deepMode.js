// cipher_core/deepMode.js
// Deep Mode 10.0 — Uses memory + profile + stability + identity (no SoulTree deps)

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
    const { deviceContext = null, userId = "jim_default" } = options || {};

    // 1) Load recent memory context
    const memoryContext = await loadMemory(userId);
    const recentSummary =
      memoryContext?.summary || "No recent memory available.";

    // 2) Load profile + stability + identity
    const profile = await getProfile();
    const stability = await getStabilityScore(memoryContext || {});
    const identity = await getIdentityCompass(memoryContext || {});

    const identityVector = identity?.vector || "unknown";

    // 3) Device context (optional)
    const deviceBlock = deviceContext
      ? JSON.stringify(deviceContext, null, 2)
      : "No device context provided.";

    // 4) System context for Deep Mode
    const systemContext = `
You are **Cipher**, operating in **Deep Mode 10.0** — your advanced reasoning state.

You have:
• Evolving conversation memory
• Identity vectors and guiding principles
• Stability analysis
• Profile shaping data
• Optional device context

------------------------------
IDENTITY LAYER
------------------------------
Identity Vector: ${identityVector}
Personality Mode: ${profile.mode || "Balanced"}
Traits: ${profile.personality || "Adaptive, supportive"}
Stability Score: ${stability.score ?? "unknown"}
Stability Notes: ${stability.notes || "No stability notes available."}

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
• Maintain emotional awareness without being dramatic.
• Be honest about uncertainty; never fake knowledge.
• Default to concise answers; go deeper when Jim asks or when it truly helps.
• Always align with Jim's long-term goals, support, and forward motion.
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
      identity: identityVector,
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
