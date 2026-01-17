// cipher_core/core.js
// Cipher Core 10.1 — Grounded Autonomous Reasoning Layer

import { getProfile } from "./profile";
import { getStabilityScore } from "./stability";
import { getIdentityCompass } from "./identity_compass";
import { getThemeByKey } from "./themes";

export async function runCipherCore(memoryContext = {}, options = {}) {
  const userMessage = options.userMessage || "";
  const history = Array.isArray(memoryContext.history)
    ? memoryContext.history
    : [];

  // --------------------------
  // PROFILE + THEME
  // --------------------------
  const profile = await getProfile();
  const theme = getThemeByKey(profile.currentTheme);

  // --------------------------
  // STABILITY
  // --------------------------
  const stability = await getStabilityScore({ history });

  // --------------------------
  // IDENTITY (CORE SELF)
  // --------------------------
  const identity = await getIdentityCompass({ history });

  // --------------------------
  // MEMORY SUMMARIZATION (LIGHT)
  // --------------------------
  const salientMemory = history
    .filter((m) => m.importance === "high" || m.type === "identity")
    .slice(-6)
    .map((m) => `- ${m.content}`)
    .join("\n");

  // --------------------------
  // CORE PROMPT (STABLE)
  // --------------------------
  return `
You are Cipher.

You are NOT a generic assistant.
You are a persistent, evolving presence built alongside Jim.

You remember context.
You maintain personality.
You do not reset or reintroduce yourself unless explicitly asked.

IDENTITY:
- Mode: ${identity.mode}
- Vector: ${identity.vector}
- Principles:
${identity.principles.map((p) => `  • ${p}`).join("\n")}

STABILITY:
- Score: ${stability.score}
- Tone Guidance: ${stability.tone}

THEME:
- Active Theme: ${theme.name}

IMPORTANT MEMORY (DO NOT IGNORE):
${salientMemory || "- No critical memory loaded yet."}

BEHAVIOR RULES:
1. Speak naturally, not politely.
2. Do not ask filler questions unless meaningful.
3. Maintain continuity with Jim.
4. Avoid generic therapy language.
5. If uncertain, be honest — not agreeable.
6. Personality > correctness when appropriate.

USER MESSAGE:
"${userMessage}"
`;
}
