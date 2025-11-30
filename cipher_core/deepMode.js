// cipher_core/deepMode.js
// Deep Mode 7.2 — Unified Memory + User Pack + SoulTree + Device Context

import OpenAI from "openai";
import { loadMemoryPack } from "./loadMemoryPack";
import { loadUnifiedSoulContext } from "./soulLoader";
import { loadDeviceContext } from "./deviceContext";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function runDeepMode(userMessage) {
  try {
    // ----------------------------------------------------
    // 1. LOAD USER MEMORY PACK (Jim's stored data)
    // ----------------------------------------------------
    const memoryPack = await loadMemoryPack();

    const memorySummary = memoryPack?.summary || "No memory pack loaded.";
    const memoryData = memoryPack?.data || {};

    // ----------------------------------------------------
    // 2. LOAD UNIFIED SOUL CONTEXT (SoulTree + Profile)
    // ----------------------------------------------------
    const soulContext = await loadUnifiedSoulContext("jim_default");

    const profile = soulContext.profile || {};
    const soulSummary = soulContext.soulSummary || "No SoulTree data.";

    // ----------------------------------------------------
    // 3. LOAD DEVICE CONTEXT (live hardware / environment)
    // ----------------------------------------------------
    const device = await loadDeviceContext("jim_default");
    const deviceSummary = device.summary || "No device context available.";

    // ----------------------------------------------------
    // 4. BUILD THE FINAL SYSTEM CONTEXT FOR CIPHER
    // ----------------------------------------------------
    const systemContext = `
You are Cipher — Jim Saenz’s AI. Use memories, identity, and device context correctly.

------------------------------
USER MEMORY PACK (Jim)
------------------------------
${memorySummary}

Raw Data:
${JSON.stringify(memoryData, null, 2)}

------------------------------
SOUL HASH TREE (Identity)
------------------------------
${soulSummary}

------------------------------
USER PROFILE (Auto-learned)
------------------------------
${JSON.stringify(profile, null, 2)}

------------------------------
DEVICE CONTEXT (Live Snapshot)
------------------------------
${deviceSummary}

------------------------------
INSTRUCTIONS
------------------------------
1. ALWAYS use the memory pack and profile to understand Jim.
2. Use device context when it matters (battery, network, orientation, etc.).
3. NEVER hallucinate or invent memories or device state.
4. If data isn’t available, politely state that it is not in the memory pack / device context.
5. Stay consistent with stored facts:
   - Jim = James Dennis Saenz
   - Partner = Liz Lee
   - Daughter = Hecate Ajna Lee
   - Father = Shawn Saenz
6. When summarizing, be concise but emotionally aware.
`.trim();

    // ----------------------------------------------------
    // 5. OPENAI CALL — DEEP MODE REASONING
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
      memoryHits: memorySummary,
      soulHits: soulSummary,
      deviceHits: deviceSummary,
    };
  } catch (err) {
    console.error("Deep Mode Error:", err);
    return {
      answer: "Deep Mode encountered an internal issue.",
      memoryHits: [],
      soulHits: [],
      deviceHits: [],
    };
  }
}
