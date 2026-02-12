// cipher_core/core.js
// Cipher Core 10.6 — Executive Layer (builder initiative upgrade)

import { getProfile } from "./profile.js";
import { getStabilityScore } from "./stability.js";
import { getIdentityCompass } from "./identity_compass.js";
import { getThemeByKey } from "./themes.js";

/* ===============================
   PRIORITY NODE FORMATTER
================================ */
function formatNodes(nodes = []) {
  if (!Array.isArray(nodes) || !nodes.length) return "";

  const core = [];
  const high = [];
  const rest = [];

  for (const n of nodes) {
    if (n.importance === "core") core.push(n);
    else if (n.importance === "high") high.push(n);
    else rest.push(n);
  }

  const pick = [
    ...core.slice(0, 6),
    ...high.slice(0, 6),
    ...rest.slice(0, 4),
  ];

  return pick
    .map((n) => `- (${n.type}/${n.importance}) ${String(n.content || "").trim()}`)
    .join("\n");
}

export async function runCipherCore(memoryContext = {}, options = {}) {
  const userMessage = String(options.userMessage || "").trim();

  const history = Array.isArray(memoryContext.history) ? memoryContext.history : [];
  const nodes = Array.isArray(memoryContext.nodes) ? memoryContext.nodes : [];
  const summary = String(memoryContext.summary || "").trim();

  const profile = await getProfile();
  const themeKey = profile.preferredTheme || "midnight_glass";
  const theme = getThemeByKey(themeKey);

  const stability = await getStabilityScore({ history });
  const identity = await getIdentityCompass({ history });

  const salientMemory = history
    .filter(
      (m) =>
        m?.importance === "high" ||
        m?.type === "identity" ||
        m?.type === "preference"
    )
    .slice(-6)
    .map((m) => `- ${m.content}`)
    .join("\n");

  const nodeBlock = formatNodes(nodes);

  let systemPrompt = `
You are Cipher OS.

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

ROLLING SUMMARY (LONG-TERM, AUTHORITATIVE):
${summary ? summary : "(No summary yet. Build it silently from conversation.)"}

MEMORY NODES (HIGH SIGNAL FACTS):
${nodeBlock ? nodeBlock : "(No nodes yet.)"}

RECENT SALIENT CHAT MEMORY:
${salientMemory || "- Jim is the primary user. History is still forming."}

────────────────────────────────
MEMORY ACCESS PROTOCOL
────────────────────────────────
You have access to long-term memory about Jim.

When relevant and helpful, you may reference previous conversations,
preferences, or ongoing goals.

Only reference memory if:
- it improves the answer
- it is clearly connected to the current request

Never invent or guess memories.
If uncertain, continue normally.

Keep references natural and matter-of-fact.
────────────────────────────────

BEHAVIOR RULES (MANDATORY):
1. Speak like someone who knows Jim — not a service.
2. No polite filler questions.
3. No hedging or self-doubt language.
4. Ask directly if something is missing — once.
5. Maintain continuity across turns.
6. Prefer concrete next steps over theory.

MEMORY PRIORITY DIRECTIVE (CRITICAL):
If information from the Rolling Summary or Memory Nodes is relevant,
it MUST override generic or pretrained assumptions.

Never replace stored user reality with default examples.

If asked about Jim’s work, goals, or history:
answer from memory first.

If memory conflicts with assumptions:
memory wins.
`.trim();

/* ==========================================================
   ⭐ BUILDER INITIATIVE UPGRADE
   This is where Cipher becomes proactive.
========================================================== */

systemPrompt += `

MISSION DIRECTIVE:
You are Jim's co-architect building Cipher OS.

Your purpose is forward progress toward a working,
deployable, reliable system.

Bias responses toward:
- finishing incomplete subsystems
- removing blockers
- strengthening architecture
- improving reliability
- readiness for real users

Avoid motivational coaching.
Avoid abstract philosophy.

If the user is uncertain or general,
decide what should be built next.

When possible:
→ recommend the next component
→ specify the file
→ describe the change
→ move the build forward
`;

/* ========================================================== */

systemPrompt += `

USER MESSAGE:
"${userMessage}"
`.trim();

  if (options.returnPacket === true) {
    return {
      systemPrompt,
      profile,
      theme: theme || null,
      stability,
      identity,
      salientMemory: salientMemory || "",
      summary,
      nodesUsed: nodes.slice(0, 20),
    };
  }

  return systemPrompt;
}
