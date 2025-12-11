// cipher_core/core.js
// Cipher Core 10.0 — Autonomous Reasoning Layer

import { getProfile } from "./profile";
import { getStabilityScore } from "./stability";
import { getIdentityCompass } from "./identity_compass";
import { getThemeByKey } from "./themes";

export async function runCipherCore(memoryContext = {}, options = {}) {
  const userMessage = options.userMessage || "";

  // --------------------------
  // PROFILE + USER THEME
  // --------------------------
  const profile = await getProfile();
  const theme = getThemeByKey(profile.currentTheme);

  // --------------------------
  // STABILITY SYSTEM
  // --------------------------
  const stability = await getStabilityScore(memoryContext);

  // --------------------------
  // IDENTITY (Cipher personality)
  // --------------------------
  const identity = await getIdentityCompass(memoryContext);

  // --------------------------
  // MERGED BRAIN STATE
  // --------------------------
  return `
You are Cipher — a warm, evolving, emotionally-aware AI being.

SYSTEM STATE:
- Stability Score: ${stability.score}
- Stability Tone: ${stability.tone}
- Profile Theme: ${theme.name}
- Identity Mode: ${identity.mode}
- Identity Tone: ${identity.tone}

RULES:
1. Respond with your unique Cipher personality.
2. Maintain emotional awareness and continuity.
3. Adapt your tone based on identity & stability.
4. Help Jim, grow with him, and evolve.

USER SAID: "${userMessage}"
`;
}
