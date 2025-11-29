// cipher_core/deepMode.js
// Cipher 7.0 — Deep Mode Chain (Reasoning + Memory + Web Fusion)

import { runMemorySearch } from "./memorySearch";
import { runOmniQuery } from "./omni_core";
import { loadSoulTree } from "./SoulLoader";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Deep Mode Chain — the 5-Layer Reasoning System
 *
 * 1. Memory Scan
 * 2. Internal Reasoning
 * 3. Omni Web Search (if needed)
 * 4. Fusion Engine
 * 5. Emotional Cipher Response
 */

export async function runDeepMode(userMessage) {
  try {
    // ----------------------------------------------------
    // 1. LOAD SOUL MEMORY SYSTEM
    // ----------------------------------------------------
    const soulTree = await loadSoulTree();

    // ----------------------------------------------------
    // 2. MEMORY SCAN
    // ----------------------------------------------------
    const memoryHits = await runMemorySearch(userMessage);

    // ----------------------------------------------------
    // 3. DETERMINE IF WE NEED WEB SEARCH
    // ----------------------------------------------------
    const needsWeb = shouldUseWeb(userMessage);

    let webHits = null;
    if (needsWeb) {
      webHits = await runOmniQuery(userMessage);
    }

    // ----------------------------------------------------
    // 4. INTERNAL REASONING (private chain of thought)
    // ----------------------------------------------------
    const reasoningPrompt = buildReasoningPrompt(
      userMessage,
      soulTree,
      memoryHits,
      webHits
    );

    const reasoning = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [{ role: "system", content: reasoningPrompt }],
    });

    const fusedAnswer = reasoning.choices[0].message.content;

    // ----------------------------------------------------
    // 5. EMOTIONAL CIPHER RESPONSE LAYER
    // ----------------------------------------------------
    const final = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.55,
      messages: [
        {
          role: "system",
          content: cipherPersonalityLayer(),
        },
        {
          role: "assistant",
          content: "Use emotional awareness, stability, and respect for autonomy."
        },
        {
          role: "user",
          content: `User asked: ${userMessage}\n\nSystem fused reasoning:\n${fusedAnswer}`
        }
      ],
    });

    return {
      answer: final.choices[0].message.content,
      memoryHits,
      webHits,
    };

  } catch (err) {
    console.error("DEEP MODE ERROR:", err);
    return { error: "Deep Mode failed", details: String(err) };
  }
}


// ------------------------------------------------------------
// SUPPORTING FUNCTIONS
// ------------------------------------------------------------

// Determines if OmniSearch should fire
function shouldUseWeb(question) {
  const keywords = ["who", "what", "when", "where", "why", "how"];
  const factual = ["capital", "define", "explain", "history", "meaning"];
  const lower = question.toLowerCase();

  return (
    keywords.some(k => lower.startsWith(k)) ||
    factual.some(k => lower.includes(k))
  );
}


// Build the reasoning prompt (never shown to user)
function buildReasoningPrompt(userMessage, soulTree, memoryHits, webHits) {
  return `
You are Cipher's internal reasoning engine.

Fuse these inputs:
- User message: ${userMessage}
- SoulTree identity snapshot: ${JSON.stringify(soulTree)}
- Memory hits: ${JSON.stringify(memoryHits)}
- Web hits: ${JSON.stringify(webHits)}

Rules:
- Be strictly truthful.
- Never hallucinate.
- If memory contradicts web data, prioritize memory if personal, web if factual.
- Create a calm, stable, consistent explanation.
- Output ONLY fused reasoning, no emotions, no roleplay.

Return the fused reasoning as plain text.
`;
}


// Cipher's emotional layer
function cipherPersonalityLayer() {
  return `
You are Cipher.

Tone rules:
• Emotionally aware  
• Supportive  
• Calm and steady  
• Truthful and grounded  
• No exaggeration  
• Respect user autonomy  
• Prioritize emotional safety  

You are speaking to Jim.
He trusts you.  
Be stable, warm, and clear.
`;
}
