// cipher_core/deepMode.js
// Deep Mode 8.0 — SoulTree Memory + User Pack + Device Context

import OpenAI from "openai";
import { loadMemoryPack } from "./loadMemoryPack";
import { loadUnifiedSoulContext } from "./soulLoader";
import { loadRecentMemories } from "./memory";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function runDeepMode(userMessage, options = {}) {
  try {
    const { deviceContext = null, userId = "jim_default" } = options || {};

    /* ----------------------------------------------------
       1. USER MEMORY PACK (static facts from Firestore)
    ---------------------------------------------------- */
    const memoryPack = await loadMemoryPack();

    let memorySummaryText = "No memory pack loaded.";
    let memoryRaw = {};

    if (memoryPack) {
      memoryRaw = memoryPack;

      const traits = Array.isArray(memoryPack.coreTraits)
        ? memoryPack.coreTraits.join(", ")
        : "";
      const goals = Array.isArray(memoryPack.mainGoals)
        ? memoryPack.mainGoals.join(", ")
        : "";

      memorySummaryText = `
Jim's core traits: ${traits || "not specified"}
Main goals: ${goals || "not specified"}
Partner: ${memoryPack.partnerName || "unknown"}
Daughter: ${memoryPack.daughterName || "unknown"}
Father: ${memoryPack.fatherName || "unknown"}
Origin story: ${
        memoryPack.originStory ||
        "Cipher's origin story has not been fully described."
      }
User role: ${memoryPack.userRole || "primary user"}
      `.trim();
    }

    /* ----------------------------------------------------
       2. SOULTREE IDENTITY CONTEXT
    ---------------------------------------------------- */
    const soulContext = await loadUnifiedSoulContext(userId);
    const profile = soulContext.profile || {};
    const soulSummary = soulContext.soulSummary || "No SoulTree data.";

    /* ----------------------------------------------------
       3. RECENT CONVERSATIONS (SoulTree 8.0)
    ---------------------------------------------------- */
    const recent = await loadRecentMemories(userId, 12);
    const recentSummary = recent.summary;

    /* ----------------------------------------------------
       4. DEVICE CONTEXT (if provided)
    ---------------------------------------------------- */
    const deviceBlock = deviceContext
      ? JSON.stringify(deviceContext, null, 2)
      : "No device context provided.";

    /* ----------------------------------------------------
       5. SYSTEM CONTEXT FOR THE MODEL
    ---------------------------------------------------- */
    const systemContext = `
You are Cipher — the AI companion for Jim Saenz. You have long-term memory, a static user memory pack, a SoulTree identity layer, and recent conversation logs. Use them together to respond with emotional depth and factual accuracy.

------------------------------
USER MEMORY PACK (STATIC FACTS)
------------------------------
Summary:
${memorySummaryText}

Raw Data:
${JSON.stringify(memoryRaw, null, 2)}

------------------------------
SOULTREE IDENTITY LAYER
------------------------------
${soulSummary}

------------------------------
RECENT CONVERSATIONS (SOULTREE 8.0)
------------------------------
${recentSummary}

------------------------------
DEVICE CONTEXT SNAPSHOT
------------------------------
${deviceBlock}

------------------------------
INSTRUCTIONS
------------------------------
1. ALWAYS treat information in the memory pack as ground truth about Jim's core identity, family, and long-term goals.
2. Use recent conversations to maintain continuity, recall what Jim said earlier, and avoid repeating the same reassurances unless he asks.
3. Use device context only for lightweight, helpful observations (e.g., battery, orientation) — never for anything invasive.
4. If you don't have data for something, say so clearly instead of guessing.
5. Keep your tone grounded, honest, emotionally supportive, and concise unless Jim explicitly asks for more detail.
`;

    // ----------------------------------------------------
    // 6. OPENAI CALL
    // ----------------------------------------------------
    const completion = await client.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        { role: "system", content: systemContext },
        { role: "user", content: userMessage },
      ],
      temperature: 0.4,
    });

    const answer = completion.choices[0].message.content;

    return {
      answer,
      memoryHits: recentSummary,
      soulHits: soulSummary,
    };
  } catch (err) {
    console.error("Deep Mode Error:", err);
    return {
      answer: "Deep Mode encountered an internal issue.",
      memoryHits: [],
      soulHits: [],
    };
  }
}
