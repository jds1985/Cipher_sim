// cipher_core/core.js
// CIPHER 6.2 — Soul Hash Tree Read/Write Core (Steps 9 + 10)

import OpenAI from "openai";
import { db } from "../firebaseAdmin";
import crypto from "crypto";

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
      .doc("main") // Cipher's canonical identity branch
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
    console.error("Soul tree load error:", err);
    return "Error loading soul tree: " + err.message;
  }
}

/* -------------------------------------------------------
   STEP 10 — Soul Node Hashing + Writeback (200-node cap)
------------------------------------------------------- */

// Hash a soul node's value so each node has a unique, stable fingerprint
function hashSoulNode(value) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex");
}

// Append a new node to cipher_branches/main and trim to last 200 nodes
async function appendSoulNode({ userMessage, cipherReply }) {
  try {
    const ref = db.collection("cipher_branches").doc("main");
    const snap = await ref.get();

    const existingNodes =
      snap.exists && Array.isArray(snap.data().nodes) ? snap.data().nodes : [];

    const value = {
      userMessage,
      cipherReply,
    };

    const node = {
      hash: hashSoulNode(value),
      value,
      timestamp: Date.now(),
    };

    const updatedNodes = [...existingNodes, node];

    // Keep only the most recent 200 nodes
    const MAX_NODES = 200;
    const trimmedNodes =
      updatedNodes.length > MAX_NODES
        ? updatedNodes.slice(updatedNodes.length - MAX_NODES)
        : updatedNodes;

    await ref.set({ nodes: trimmedNodes }, { merge: true });
  } catch (err) {
    console.error("Soul node append error:", err);
    // Do not throw — Cipher should still reply even if the write fails
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

  /* ---------------------------------------
     6. Write new Soul Node (Step 10)
        (Non-blocking for experience; failures are logged only)
  --------------------------------------- */
  await appendSoulNode({ userMessage: message, cipherReply: reply });

  return reply;
}
