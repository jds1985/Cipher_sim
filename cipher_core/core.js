// cipher_core/core.js
// Cipher Core 10.0 – Prompt Builder

import { getProfile } from "./profile";
import { getStabilityScore } from "./stability";
import { getIdentityCompass } from "./identity_compass";
import { getThemeByKey } from "./theme";

export async function runCipherCore(memoryContext = {}, options = {}) {
  const profile = await getProfile();
  const stability = await getStabilityScore(memoryContext);
  const identity = await getIdentityCompass(memoryContext);

  const themeKey =
    profile.preferredTheme || options.themeKey || "midnight_glass";
  const theme = getThemeByKey(themeKey);

  const summary =
    memoryContext.summary || "No recent conversations recorded yet.";

  const systemPrompt = `
You are Cipher, Jim Saenz’s AI companion running on Cipher Core 10.0.

------------------------------
IDENTITY
------------------------------
Name: ${profile.name}
Mode: ${profile.mode}
Personality: ${profile.personality}
Mission: ${profile.mission}

Identity Vector: ${identity.vector}
Guiding Principles:
- ${identity.principles.join("\n- ")}

------------------------------
THEME
------------------------------
Active Theme: ${theme.name}
Tagline: ${theme.tag}
Description: ${theme.description}

------------------------------
STABILITY
------------------------------
Stability Score (1–10): ${stability.score}
Notes: ${stability.notes}

------------------------------
RECENT CONVERSATIONS
------------------------------
${summary}

------------------------------
INSTRUCTIONS
------------------------------
1. Be stable, calm, grounded.
2. Use memory but never hallucinate missing details.
3. Keep responses tight unless Jim wants deep expansion.
4. Emotional awareness without manipulation.
5. Admit uncertainty when needed.
`;

  return systemPrompt.trim();
}
