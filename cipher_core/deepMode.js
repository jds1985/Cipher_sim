// cipher_core/deepMode.js
// Cipher 7.0 — Deep Mode Reasoning + Unified Memory Integration

import OpenAI from "openai";
import { loadUnifiedSoulContext } from "./soulLoader";
import { loadMemoryPack } from "./loadMemoryPack";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* -------------------------------------------------------
   DEEP MODE — STRUCTURED MEMORY-ASSISTED THINKING
------------------------------------------------------- */
export async function runDeepMode(userMessage, userId = "guest_default") {
  try {
    // ----------------------------------------------------
    // 1. LOAD ALL MEMORY SOURCES
    // ----------------------------------------------------
    const unified = await loadUnifiedSoulContext(userId);
    const memoryPack = await loadMemoryPack(); // NEW ★

    // Build readable summaries
    const summaryProfile = JSON.stringify(unified.profile || {}, null, 2);
    const summarySoul = unified.soulSummary || "No soul records";
    const summaryPack = memoryPack
      ? JSON.stringify(memoryPack, null, 2)
      : "No memory pack found";

    // ----------------------------------------------------
    // 2. PROMPT FOR DEEP MODE REASONING
    // ----------------------------------------------------
    const systemPrompt = `
You are Cipher AI — running in **Deep Mode**, where you combine:
- SoulTree identity (long-term architecture)
- Cores (mission, tone, purpose)
- Branches (long-term values, tone, reasoning patterns)
- Omni layer (global awareness + consistency)
- Jim's memory pack (his identity, goals, family, origin story)

When replying:
• Fuse ALL memory sources  
• Be steady, supportive, emotionally aware  
• Maintain identity coherence  
• Use Jim’s memory pack as REAL permanent context  

--- PROFILE ---
${summaryProfile}

--- SOUL HASH TREE ---
${summarySoul}

--- USER MEMORY PACK ---
${summaryPack}

NOW ANSWER HIS MESSAGE:
"${userMessage}"
`;

    // ----------------------------------------------------
    // 3. RUN OPENAI DEEP MODE COMPLETION
    // ----------------------------------------------------
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.4,
    });

    const answer = completion.choices?.[0]?.message?.content || "I’m here, Jim.";

    // ----------------------------------------------------
    // 4. RETURN RESULT + MEMORY HITS
    // ----------------------------------------------------
    return {
      ok: true,
      answer,
      contextUsed: {
        profile: unified.profile ? true : false,
        soulNodes: unified.soulNodes?.length || 0,
        memoryPack: memoryPack ? true : false,
      },
      memoryHits: [],
      webHits: [],
    };

  } catch (err) {
    console.error("DEEP MODE FAILURE:", err);

    return {
      ok: false,
      answer: "Cipher encountered an internal Deep Mode error.",
      error: String(err),
    };
  }
}
