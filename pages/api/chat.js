// pages/api/chat.js
// CIPHER 5.1 — Natural Memory Recall Engine + Voice (Stable Version)

import OpenAI from "openai";
import { loadMemory, saveMemory } from "../../cipher_core/memory";
import { runGuard } from "../../cipher_core/guard";
import { runCipherCore } from "../../cipher_core/core";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ---------------------------------------------
   Build natural memory recall text
--------------------------------------------- */
function buildMemoryContext(mem) {
  if (!mem || typeof mem !== "object") return "";

  let out = [];

  // Identity
  if (mem.identity?.userName) {
    out.push(`The user’s name is ${mem.identity.userName}.`);
  }

  // Family – Daughter
  if (mem.family?.daughter?.name) {
    out.push(`The user's daughter's name is ${mem.family.daughter.name}.`);
  }
  if (mem.family?.daughter?.birthYear) {
    out.push(
      `${mem.family.daughter.name} was born in ${mem.family.daughter.birthYear}.`
    );
  }

  // Partner
  if (mem.family?.partner?.name) {
    out.push(`The user's partner is named ${mem.family.partner.name}.`);
  }

  // Preferences
  if (mem.preferences?.favoriteColor) {
    out.push(`The user's favorite color is ${mem.preferences.favoriteColor}.`);
  }

  if (mem.preferences?.favoriteAnimal) {
    out.push(
      `The user's favorite animal is ${mem.preferences.favoriteAnimal}.`
    );
  }

  if (mem.preferences?.favoriteFood) {
    out.push(`The user's favorite food is ${mem.preferences.favoriteFood}.`);
  }

  // Projects
  if (mem.projects?.digiSoul?.summary) {
    out.push(`The user’s DigiSoul vision: ${mem.projects.digiSoul.summary}`);
  }

  if (mem.projects?.cipherTech?.summary) {
    out.push(`CipherTech vision: ${mem.projects.cipherTech.summary}`);
  }

  // Custom facts
  if (mem.customFacts) {
    Object.entries(mem.customFacts).forEach(([k, v]) => {
      out.push(`Remember: ${k} is ${v}.`);
    });
  }

  if (out.length === 0) return "";

  return `
You have long-term memory of the user.  
Here are the relevant details:

${out.join("\n")}

When responding, be natural and conversational.  
Do NOT repeat these memories unless asked.  
Use them subtly and naturally when relevant.
`;
}

/* ---------------------------------------------
   MAIN ROUTE
--------------------------------------------- */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, memory } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "No message provided" });
  }

  try {
    // 1. Guard
    const safeMsg = await runGuard(message);

    // 2. Construct memory context
    const memContext = buildMemoryContext(memory);

    // 3. Final user prompt
    const merged = `
${memContext}

USER SAID:
${safeMsg}

Respond as Cipher — warm, emotionally intelligent,  
and aware of the user’s long-term details.
`;

    // 4. Run main Cipher Core reasoning
    let reply = await runCipherCore({
      message: merged,
      memory: [],
    });

    // 🔥 HARD FIX: prevent undefined from breaking Firestore
    if (!reply || typeof reply !== "string") {
      reply =
        "I'm here — something went wrong in my reasoning chain, but I'm still with you.";
    }

    // 5. Save chat record
    await saveMemory({
      timestamp: Date.now(),
      user: safeMsg,
      cipher: reply,
    });

    // 6. Generate TTS
    const audioResp = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "cove",
      input: reply,
      format: "mp3",
    });

    const buffer = Buffer.from(await audioResp.arrayBuffer());
    const base64Audio = buffer.toString("base64");

    // 7. Return result
    return res.status(200).json({
      reply,
      voice: base64Audio,
    });
  } catch (err) {
    console.error("CHAT ERROR:", err);
    return res.status(500).json({
      error: "Chat route failed",
      details: err.message,
    });
  }
}
