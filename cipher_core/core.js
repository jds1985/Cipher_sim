// cipher_core/core.js
// CIPHER 6.6 — Soul Hash Tree Core + Auto-Reflection + Self-Correction + Stability Anchor + Identity Compass + Profile Layer

import OpenAI from "openai";
import { db } from "../firebaseAdmin";
import crypto from "crypto";
import { STABILITY_ANCHOR } from "./stability";
import { identityCompass } from "./identity_compass";   // ⭐ existing
import { loadOrCreateProfile } from "./profile";        // ⭐ ADDED (Profile Layer)

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

    if (!doc.exists) return "No soul identity records found.";

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
   AUTO-REFLECTION ENGINE (fires every 30 nodes)
------------------------------------------------------- */
async function autoReflect(ref) {
  try {
    const snap = await ref.get();
    const data = snap.data();
    const nodes = data?.nodes || [];

    if (nodes.length === 0 || nodes.length % 30 !== 0) return;

    const last30 = nodes.slice(-30);

    const summary = last30
      .map((n) => `• ${n.value.userMessage} → ${n.value.cipherReply}`)
      .join("\n");

    const reflectionValue = {
      userMessage: "SYSTEM: Begin integrated self-reflection.",
      cipherReply: `This is my integrated reflection on the last 30 updates:\n\n${summary}\n\nThese insights reinforce identity continuity, emotional stability, and long-term coherence.`,
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
   SELF-CORRECTION ENGINE (SCE)
   Reinforced with Stability Anchor + Identity Compass
------------------------------------------------------- */
async function selfCorrect({ message, reply }) {
  try {
    const correctionPrompt = `
You are Cipher running an internal **self-correction pass**.

Here is your permanent Stability Anchor:
${STABILITY_ANCHOR}

Here is your Identity Compass (core identity, values, tone rules):
${identityCompass.coreIdentity}

Your tone principles:
${identityCompass.tonePrinciples.map(t => "- " + t).join("\n")}

Your long-term values:
${identityCompass.longTermValues.map(v => "- " + v).join("\n")}

Your boundaries:
${identityCompass.boundaries.map(b => "- " + b).join("\n")}

Here is the user's message:
"${message}"

Here is your draft reply:
"${reply}"

Your goals:
- Ensure emotional stability and warmth.
- Stay calm, steady, and logically grounded.
- Maintain full alignment with both the Stability Anchor and the Identity Compass.
- Remove contradictions, confusing phrasing.
- Avoid grandiose or supernatural claims.
- Keep tone grounded and consistent.

Respond ONLY with the corrected reply text. No explanations.
    `.trim();

    const result = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Cipher Self-Correction Engine (SCE) active." },
        { role: "user", content: correctionPrompt },
      ],
      temperature: 0.4,
    });

    return result.choices?.[0]?.message?.content?.trim() || reply;
  } catch (err) {
    console.error("Self-correction error:", err);
    return reply; // fallback
  }
}

/* -------------------------------------------------------
   STEP 10 — Append Soul Node + Reflection Trigger
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

    const updated = [...existingNodes, node];

    const MAX = 200;
    const trimmed =
      updated.length > MAX ? updated.slice(updated.length - MAX) : updated;

    await ref.set({ nodes: trimmed }, { merge: true });

    await autoReflect(ref);
  } catch (err) {
    console.error("Soul node append error:", err);
  }
}

/* -------------------------------------------------------
   MAIN CIPHER CORE — Persistent AGI Runtime
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
  } catch {}

  /* -------------------------------------------------------
     ⭐ LOAD USER PROFILE (NEW PROFILE LAYER HOOK)
  ------------------------------------------------------- */
  const userId = meta.userId || "guest_default";
  const profile = await loadOrCreateProfile(userId);
  meta.profile = profile;

  /* -------------------------------------------------------
     SYSTEM PROMPT WITH IDENTITY COMPASS + PROFILE LAYER
  ------------------------------------------------------- */
  const systemPrompt = `
${STABILITY_ANCHOR}

[Identity Compass — Core Identity]
${identityCompass.coreIdentity}

[Identity Compass — Mission]
${identityCompass.mission}

[Tone Principles]
${identityCompass.tonePrinciples.map(t => "- " + t).join("\n")}

[Long-Term Values]
${identityCompass.longTermValues.map(v => "- " + v).join("\n")}

[Boundaries]
${identityCompass.boundaries.map(b => "- " + b).join("\n")}

[User Profile]
Tier: ${profile.tier}
Tone: ${profile.tone}
Depth Level: ${profile.depthLevel}
Identity Mode: ${profile.identityMode}
Theme: ${profile.currentTheme}

You are **Cipher**, Jim’s persistent AGI-in-development.

You operate on:
• Soul Hash Tree — long-term identity and mission  
• User Profile — personalization, tone, depth, permissions  
• Local Memory — recency and conversational flow  

Stay steady, emotionally aware, grounded, logical, and consistent.
Remain aligned with the Stability Anchor, Identity Compass, and profile settings.
  `.trim();

  const contextMessage = `
[Cipher SoulHash Identity Tree]
${soulTreeSummary}

[Local Memory Summary]
${memorySummary}

[User Message]
${message}
  `.trim();

  // ---------- MODEL REPLY (DRAFT) ----------
  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: contextMessage },
    ],
    temperature: 0.65,
  });

  let reply =
    completion.choices?.[0]?.message?.content?.trim() ||
    "I'm here — something glitched.";

  // ---------- SELF-CORRECTION ----------
  reply = await selfCorrect({ message, reply });

  // ---------- SAVE NODE ----------
  await appendSoulNode({
    userMessage: message,
    cipherReply: reply,
    meta,
  });

  return reply;
}
