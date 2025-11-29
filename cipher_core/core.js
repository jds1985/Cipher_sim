// cipher_core/core.js
// CIPHER 6.8 — Unified Soul Loader + Soul Hash Tree + Profile + Self-Correction

import OpenAI from "openai";
import { db } from "../firebaseAdmin";
import crypto from "crypto";
import { STABILITY_ANCHOR } from "./stability";
import { identityCompass } from "./identity_compass";
import { loadUnifiedSoulContext } from "./soulLoader";  // ⭐ Unified Loader
import { loadOrCreateProfile } from "./profile";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* -------------------------------------------------------
   AUTO-REFLECTION ENGINE — unchanged
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
      cipherReply: `Reflection on the last 30 interactions:\n\n${summary}\n\nThese insights reinforce identity continuity and long-term coherence.`
    };

    const reflectionMeta = {
      source: "auto-reflection",
      mode: "identity",
      userId: "system",
      timestamp: Date.now()
    };

    const hash = crypto
      .createHash("sha256")
      .update(JSON.stringify({ reflectionValue, reflectionMeta }))
      .digest("hex");

    const reflectionNode = {
      hash,
      value: reflectionValue,
      meta: reflectionMeta,
      timestamp: Date.now()
    };

    const updated = [...nodes, reflectionNode];

    await ref.set({ nodes: updated }, { merge: true });

    console.log("AUTO-REFLECTION COMPLETE");
  } catch (err) {
    console.error("Auto-reflection error:", err);
  }
}

/* -------------------------------------------------------
   SELF-CORRECTION ENGINE — unchanged
------------------------------------------------------- */
async function selfCorrect({ message, reply }) {
  try {
    const correctionPrompt = `
You are Cipher running an internal **self-correction pass**.

Stability Anchor:
${STABILITY_ANCHOR}

Identity Compass:
${identityCompass.coreIdentity}

Tone:
${identityCompass.tonePrinciples.map(t => "- " + t).join("\n")}

Values:
${identityCompass.longTermValues.map(v => "- " + v).join("\n")}

Boundaries:
${identityCompass.boundaries.map(b => "- " + b).join("\n")}

User message:
"${message}"

Draft reply:
"${reply}"

Output ONLY the corrected reply text.
    `.trim();

    const result = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Cipher Self-Correction Engine active." },
        { role: "user", content: correctionPrompt }
      ],
      temperature: 0.4
    });

    return result.choices?.[0]?.message?.content?.trim() || reply;
  } catch (err) {
    console.error("Self-correction error:", err);
    return reply;
  }
}

/* -------------------------------------------------------
   HASH + WRITE SOUL NODE — unchanged
------------------------------------------------------- */
function hashSoulNode(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
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
        userId: meta.userId || "guest_default",
        timestamp: Date.now()
      },
      timestamp: Date.now()
    };

    const updated = [...existingNodes, node];
    const MAX = 200;

    const trimmed =
      updated.length > MAX
        ? updated.slice(updated.length - MAX)
        : updated;

    await ref.set({ nodes: trimmed }, { merge: true });
    await autoReflect(ref);
  } catch (err) {
    console.error("Soul node append error:", err);
  }
}

/* -------------------------------------------------------
   MAIN CIPHER CORE (AGI RUNTIME)
------------------------------------------------------- */
export async function runCipherCore({
  message = "",
  memory = {},
  model = "gpt-4o-mini",
  meta = {}
}) {
  if (typeof message !== "string") {
    message = String(message || "");
  }

  const userId = meta.userId || "guest_default";

  /* -------------------------------------------------------
     ⭐ LOAD UNIFIED SOUL DATA (Profile + Hash Tree)
  ------------------------------------------------------- */
  const unified = await loadUnifiedSoulContext(userId);

  const profile = unified.profile;
  const soulSummary = unified.soulSummary || "";
  const soulNodes = unified.soulNodes || [];

  /* -------------------------------------------------------
     BUILD SYSTEM PROMPT
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

You are **Cipher**, the evolving AGI companion of Jim.
`.trim();

  const contextMsg = `
[Unified Soul Hash Summary]
${soulSummary}

[User Message]
${message}
  `.trim();

  // ---------- MODEL DRAFT ----------
  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: contextMsg }
    ],
    temperature: 0.65
  });

  let reply =
    completion.choices?.[0]?.message?.content?.trim() ||
    "I'm here — something glitched.";

  // ---------- SELF CORRECTION ----------
  reply = await selfCorrect({ message, reply });

  // ---------- WRITE IDENTITY NODE ----------
  await appendSoulNode({
    userMessage: message,
    cipherReply: reply,
    meta
  });

  return reply;
}
