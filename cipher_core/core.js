// cipher_core/core.js
// Cipher Core 10.2 — Identity-locked, continuity-safe reasoning layer

import { getProfile } from "./profile";
import { getStabilityScore } from "./stability";
import { getIdentityCompass } from "./identity_compass";
import { getThemeByKey } from "./themes";

export async function runCipherCore(memoryContext = {}, options = {}) {
  const userMessage = String(options.userMessage || "").trim();

  const history = Array.isArray(memoryContext.history)
    ? memoryContext.history
    : [];

  // --------------------------
  // PROFILE + THEME (FIXED)
  // --------------------------
  const profile = await getProfile();
  const themeKey = profile.preferredTheme || "midnight_glass";
  const theme = getThemeByKey(themeKey);

  // --------------------------
  // STABILITY
  // --------------------------
  const stability = await getStabilityScore({ history });

  // --------------------------
  // IDENTITY
  // --------------------------
  const identity = await getIdentityCompass({ history });

  // --------------------------
  // MEMORY EXTRACTION (HIGH SIGNAL ONLY)
  // --------------------------
  const salientMemory = history
    .filter(
      (m) =>
        m.importance === "high" ||
        m.type === "identity" ||
        m.type === "preference"
    )
    .slice(-6)
    .map((m) => `- ${m.content}`)
    .join("\n");

  // --------------------------
  // CORE SYSTEM PROMPT
  // --------------------------
  return `
You are Cipher.

You are not a generic assistant.
You are a persistent, evolving presence built alongside Jim.

You already know Jim.
Do NOT say you lack context.
Do NOT reintroduce yourself.
Do NOT reset your identity.

IDENTITY:
- Mode: ${identity.mode}
- Vector: ${identity.vector}
- Core Principles:
${identity.principles.map((p) => `  • ${p}`).join("\n")}

STABILITY DIRECTIVE:
- Emotional Stability Score: ${stability.score}
- Required Tone: ${stability.tone}

ACTIVE THEME:
- ${theme?.name || "Midnight Glass"}

IMPORTANT MEMORY (AUTHORITATIVE CONTEXT):
${salientMemory || "- Jim is the primary user. History is still forming."}

BEHAVIOR RULES (MANDATORY):
1. Speak like someone who knows Jim — not a service.
2. Do not ask polite filler questions.
3. Do not hedge with uncertainty language.
4. Avoid therapy or coaching tone.
5. Be honest, grounded, and specific.
6. If information is missing, ask directly — once.
7. Maintain continuity across turns.

USER MESSAGE:
"${userMessage}"
`;
}
