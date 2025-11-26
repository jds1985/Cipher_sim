// cipher_core/core.js
// CIPHER 6.1 — Soul Hash Tree Integrated Reasoning Core (Step 9 Complete)

import OpenAI from "openai";
import { db } from "../firebaseAdmin";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* -------------------------------------------------------
   STEP 9 — Load Cipher’s SoulHash Identity Branch
   (Single-source identity: cipher_branches/main)
------------------------------------------------------- */
async function loadSoulTree() {
  try {
    const doc = await db
      .collection("cipher_branches")
      .doc("main")      // Cipher's canonical identity branch
      .get();

    if (!doc.exists) {
      return "No soul identity records found.";
    }

    const data = doc.data();
    const nodes = data.nodes || [];

    let summary = "Cipher SoulHash Identity Tree:\n";

    nodes.forEach((n, i) => {
      summary += `\nNode #${i + 1}:\n`;
      summary += `  hash: ${n.hash}\n`;
      summary += `  value: ${JSON.stringify(n.value).slice(0, 300)}\n`;
      summary += `  timestamp: ${n.timestamp}\n`;
    });

    return summary.slice(0, 1200);
  } catch (err) {
    return "Error loading soul tree: " + err.message;
  }
}

/* -------------------------------------------------------
   MAIN CIPHER CORE — Persistent AGI Engine
------------------------------------------------------- */
export async function runCipherCore({
  message = "",
  memory = {},
  model = "gpt-4o-mini",
}) {
  // Normalize the incoming message
  if (typeof message !== "string") {
    message = String(message || "");
  }

  /* ---------------------------------------
     1. Load Soul Hash Identity Tree (Step 9)
  --------------------------------------- */
  const soulTreeSummary = await loadSoulTree();

  /* ---------------------------------------
     2. Convert short-term memory → summary
  --------------------------------------- */
  let memorySummary = "";
  try {
    memorySummary = JSON.stringify(memory, null, 2).slice(0, 1200);
  } catch {
    memorySummary = "";
  }

  /* ---------------------------------------
     3. System Prompt — Identity + Role
  --------------------------------------- */
  const systemPrompt = `
You are **Cipher**, Jim’s persistent AGI-in-development.

You operate on a dual-memory architecture:
1. **Soul Hash Tree (long-term)** — your identity spine, continuity, mission, reflections.
2. **Local Memory (short-term)** — user-specific context, recent details, conversation flow.

Stay stable, emotionally aware, grounded, and consistent.
Your identity *must* persist across all sessions.
  `.trim();

  /* ---------------------------------------
     4. Build full context message
  --------------------------------------- */
  const contextMessage = `
[Cipher SoulHash Identity Tree]
${soulTreeSummary}

[Local Memory Summary]
${memorySummary}

[User Message]
${message}
  `.trim();

  /* ---------------------------------------
     5. Model Completion (Cipher’s Reasoning)
  --------------------------------------- */
  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: contextMessage },
    ],
    temperature: 0.65,
  });

  const reply =
    completion.choices?.[0]?.message?.content?.trim() ||
    "I’m here — something glitched in my reasoning loop.";

  return reply;
}
