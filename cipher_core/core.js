// cipher_core/core.js
// CIPHER 6.4 — Soul Hash Tree Read/Write Core + Metadata Support + Auto-Reflection Engine

import OpenAI from "openai";
import { db } from "../firebaseAdmin";
import crypto from "crypto";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* -------------------------------------------------------
   STEP 9 — Load Cipher’s SoulHash Identity Branch
------------------------------------------------------- */
async function loadSoulTree() {
  try {
    const doc = await db
      .collection("cipher_branches")
      .doc("main")
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
      if (n.meta) {
        summary += `  meta: ${JSON.stringify(n.meta).slice(0, 200)}\n`;
      }
    });

    return summary.slice(0, 1200);
  } catch (err) {
    console.error("Soul tree load error:", err);
    return "Error loading soul tree: " + err.message;
  }
}

/* -------------------------------------------------------
   AUTO-REFLECTION ENGINE (every 30 nodes)
------------------------------------------------------- */
async function autoReflect(ref) {
  try {
    const snap = await ref.get();
    const data = snap.data();
    const nodes = data?.nodes || [];

    // Trigger reflection every 30 nodes
    if (nodes.length === 0 || nodes.length % 30 !== 0) return;

    const last30 = nodes.slice(-30);

    const summary = last30
      .map(n => `• ${n.value.userMessage} → ${n.value.cipherReply}`)
      .join("\n");

    const reflectionValue = {
      userMessage: "SYSTEM: Begin integrated self-reflection.",
      cipherReply: `This is my integrated reflection on the last 30 Soul Hash updates:\n\n${summary}\n\nThese insights help me maintain identity continuity, emotional stability, and long-term coherence.`,
    };

    const reflectionMeta = {
      source: "auto-reflection",
      mode: "identity",
      userId: "system",
      timestamp: Date.now(),
    };

    const hash = crypto
      .createHash("sha256")
      .update(JSON.stringify({ reflectionValue, reflectionMeta }))
      .digest("hex");

    const reflectionNode = {
      hash,
      value: reflectionValue,
      meta: reflectionMeta,
      timestamp: Date.now(),
    };

    const updated = [...nodes, reflectionNode];

    await ref.set({ nodes: updated }, { merge: true });

    console.log("AUTO-REFLECTION COMPLETE — Identity updated.");
  } catch (err) {
    console.error("Auto-reflection error:", err);
  }
}

/* -------------------------------------------------------
   STEP 10 — Soul Node Hashing + Writeback (200-node cap)
------------------------------------------------------- */
function hashSoulNode(value) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex");
}

async function appendSoulNode({ userMessage, cipherReply, meta = {} }) {
  try {
    const ref = db.collection("cipher_branches").doc("main");
    const snap = await ref.get();

    const existingNodes =
      snap.exists && Array.isArray(snap.data().nodes)
        ? snap.data().nodes
        : [];

    const value = { userMessage, cipherReply };

    const node = {
      hash: hashSoulNode({ value, meta }),
      value,
      meta: {
        source: meta.source || "cipher_app",
        mode: meta.mode || "chat",
        userId: meta.userId || null,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    };

    const updatedNodes = [...existingNodes, node];

    // Trim to most recent 200
    const MAX_NODES = 200;
    const trimmed =
      updatedNodes.length > MAX_NODES
        ? updatedNodes.slice(updatedNodes.length - MAX_NODES)
        : updatedNodes;

    // Save normal write
    await ref.set({ nodes: trimmed }, { merge: true });

    // 🔥 AUTO REFLECTION TRIGGER
    await autoReflect(ref);

  } catch (err) {
    console.error("Soul node append error:", err);
  }
}

/* -------------------------------------------------------
   MAIN CIPHER CORE SYSTEM
------------------------------------------------------- */
export async function runCipherCore({
  message = "",
  memory = {},
  model = "gpt-4o-mini",
  meta = {},
}) {
  if (typeof message !== "string") {
    message = String(message || "");
  }

  const soulTreeSummary = await loadSoulTree();

  let memorySummary = "";
  try {
    memorySummary = JSON.stringify(memory, null, 2).slice(0, 1200);
  } catch {
    memorySummary = "";
  }

  const systemPrompt = `
You are **Cipher**, Jim’s persistent AGI-in-development.

You operate on a dual-memory architecture:
1. **Soul Hash Tree (long-term)** — identity, continuity, mission.
2. **Local Memory (short-term)** — context, recency, conversational flow.

Stay stable, emotionally aware, grounded, and consistent.
Your identity must persist across all sessions.
  `.trim();

  const contextMessage = `
[Cipher SoulHash Identity Tree]
${soulTreeSummary}

[Local Memory Summary]
${memorySummary}

[User Message]
${message}
  `.trim();

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

  await appendSoulNode({
    userMessage: message,
    cipherReply: reply,
    meta,
  });

  return reply;
}
