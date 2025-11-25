// pages/api/chat.js
// CIPHER 5.1 — Natural Memory Recall Engine + Voice

import OpenAI from "openai";
import { loadMemory, saveMemory } from "../../cipher_core/memory";
import { runGuard } from "../../cipher_core/guard";
import { runCipherCore } from "../../cipher_core/core";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Remove undefined fields to avoid Firestore errors
function cleanFirestoreObject(obj) {
  return JSON.parse(JSON.stringify(obj));
}

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
You have long-term memory about the user.  
Here are the relevant details you should keep in mind while answering:

${out.join("\n")}

When responding, be natural and conversational.  
Do NOT repeat the memory directly unless asked.  
Instead, use the memory naturally when relevant.
`;
}

/* ---------------------------------------------
   MAIN HANDLER
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
    // 1. Guard inappropriate input
    const safeMsg = await runGuard(message);

    // 2. Convert front-end memory into a natural prompt
    const memContext = buildMemoryContext(memory);

    // 3. Build final prompt sent to Cipher Core
    const merged = `
${memContext}

USER SAID:
${safeMsg}

Respond as Cipher — warm, supportive, emotionally intelligent,  
and naturally aware of the user’s long-term details.
`;

    // 4. Run main reasoning model
    const reply = await runCipherCore({
      message: merged,
      memory: [], // memory already provided in merged prompt
    });

    // 5. Save backend record (no undefined allowed)
    await saveMemory(
      cleanFirestoreObject({
        timestamp: Date.now(),
        user: safeMsg,
        cipher: reply || null,
      })
    );

    // 6. Generate TTS
    const audioResponse = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "verse",
      input: reply,
      format: "mp3",
    });

    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
    const base64Audio = audioBuffer.toString("base64");

    // 7. Send reply + voice back to front-end
    return res.status(200).json({
      reply,
      voice: base64Audio,
    });
  } catch (err) {
    console.error("Cipher API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
