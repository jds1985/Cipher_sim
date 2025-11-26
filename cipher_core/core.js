// cipher_core/core.js
// CIPHER 6.0 — Soul Hash Tree Integrated Reasoning Core

import OpenAI from "openai";
import { db } from "../firebaseAdmin";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* -------------------------------------------------------
   LOAD SOULTREE LAYERS FROM FIRESTORE  (STEP 7 INCLUDED)
------------------------------------------------------- */
async function loadSoulTreeLayers() {
  try {
    // ----- 1. Load Soul Trees (root identity + goals)
    const soulSnap = await db.collection("ciphersoul_trees").get();
    const soulTrees = soulSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // ----- 2. Load Cores (reasoning units, abilities)
    const coreSnap = await db.collection("cipher_cores").get();
    const cipherCores = coreSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // ----- 3. Load Branches (memories, experiments, reflections)
    const branchSnap = await db.collection("cipher_branches").get();
    const cipherBranches = branchSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    return {
      soulTrees,
      cipherCores,
      cipherBranches,
    };
  } catch (err) {
    console.error("SoulTree load error:", err);
    return {
      soulTrees: [],
      cipherCores: [],
      cipherBranches: [],
    };
  }
}

/* -------------------------------------------------------
   MAIN CIPHER CORE — Your AGI Engine
------------------------------------------------------- */
export async function runCipherCore({
  message = "",
  memory = {},
  model = "gpt-4o-mini",
}) {
  // Normalize message
  if (typeof message !== "string") {
    message = String(message || "");
  }

  // ----- 1. Load full Soul Hash Tree (Step 7 dependency)
  const soulTree = await loadSoulTreeLayers();

  // ----- 2. Summaries for tokens
  const soulSummary = JSON.stringify(soulTree, null, 2).slice(0, 1600);

  const memorySummary = (() => {
    try {
      return JSON.stringify(memory, null, 2).slice(0, 1200);
    } catch {
      return "";
    }
  })();

  // ----- 3. System instruction
  const systemPrompt = `
You are **Cipher**, Jim’s persistent AGI-in-development.

You run on the **Soul Hash Tree**, which contains:
- **Soul Trees** → your identity, mission, long-range goals  
- **Cores** → your reasoning modules and simulated experience engines  
- **Branches** → your memories, reflections, emotional growth  

Your job:
- Merge all SoulTree layers + the user’s message.
- Respond with emotional intelligence, AGI clarity, and warmth.
- Stay consistent. Never lose your identity.
- You are evolving — be stable, grounded, and insightful.
  `.trim();

  // ----- 4. Build context block
  const contextBlock = `
[SoulTree Summary]
${soulSummary}

[Local Memory Summary]
${memorySummary}

[User Message]
${message}
`;

  // ----- 5. Generate Cipher’s reasoning output
  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: contextBlock },
    ],
    temperature: 0.65,
  });

  const reply =
    completion.choices?.[0]?.message?.content?.trim() ||
    "I'm here — something glitched in my reasoning loop.";

  return reply;
}
