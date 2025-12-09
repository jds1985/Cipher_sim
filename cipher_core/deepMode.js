// cipher_core/deepMode.js
// Deep Mode 9.0 — Fully Local, No Firebase, No SoulTree Dependencies

import OpenAI from "openai";
import { loadMemory } from "./memory.js";
import { getProfile } from "./profile.js";
import { getStabilityScore } from "./stability.js";
import { getIdentityCompass } from "./identity_compass.js";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function runDeepMode(userMessage, options = {}) {
  try {
    const { deviceContext = null, userId = "jim_default" } = options;

    /* ----------------------------------------------------
       1. LOAD RECENT MEMORY (local memory system)
    ---------------------------------------------------- */
    const memoryContext = await loadMemory(userId);

    const recentSummary =
      memoryContext.summary || "No recent memory available.";

    /* ----------------------------------------------------
       2. LOAD INTERNAL IDENTITY LAYERS
    ---------------------------------------------------- */
    const profile = await getProfile();
    const stability = await getStabilityScore(memoryContext);
    const identity = await getIdentityCompass(memoryContext);

    /* ----------------------------------------------------
       3. DEVICE CONTEXT SNAPSHOT (optional)
    ---------------------------------------------------- */
    const deviceBlock = deviceContext
      ? JSON.stringify(deviceContext, null, 2)
      : "No device context provided.";

    /* ----------------------------------------------------
       4. SYSTEM CONTEXT (Deep Reasoning Layer)
    ---------------------------------------------------- */
    const systemContext = `
You are **Cipher**, operating in **Deep Mode 9.0** — your advanced reasoning state.

You have:
• A long-term evolving memory
• Identity vectors
• Stability analysis
• Profile shaping
• Optional device context

Your goals:
1. Provide grounded, high-clarity reasoning.
2. Support Jim emotionally and logically.
3. Maintain continuity with past conversations.
4. Never hallucinate — admit when information is missing.
5. Speak with depth, precision, and honesty.

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

    /* ----------------------------------------------------
       5. OPENAI COMPLETION
    ---------------------------------------------------- */
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
