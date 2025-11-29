// pages/api/chat.js
// CIPHER 6.7 — Clean Chat Route using Soul Hash Tree Core + Profile + TTS

import OpenAI from "openai";
import { runGuard } from "../../cipher_core/guard";
import { runCipherCore } from "../../cipher_core/core";
import { saveMemory } from "../../cipher_core/memory";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ============================================================
   1. BUILD USER MEMORY CONTEXT (LONG-TERM FACTS)
============================================================ */
function buildMemoryContext(mem) {
  if (!mem || typeof mem !== "object") return "";

  let out = [];

  if (mem.identity?.userName) {
    out.push(`The user’s name is ${mem.identity.userName}.`);
  }
  if (mem.family?.daughter?.name) {
    out.push(`The user's daughter's name is ${mem.family.daughter.name}.`);
  }
  if (mem.family?.daughter?.birthYear) {
    out.push(
      `${mem.family.daughter.name} was born in ${mem.family.daughter.birthYear}.`
    );
  }
  if (mem.family?.partner?.name) {
    out.push(`The user's partner is named ${mem.family.partner.name}.`);
  }
  if (mem.preferences?.favoriteColor) {
    out.push(`The user's favorite color is ${mem.preferences.favoriteColor}.`);
  }
  if (mem.preferences?.favoriteAnimal) {
    out.push(`The user's favorite animal is ${mem.preferences.favoriteAnimal}.`);
  }
  if (mem.preferences?.favoriteFood) {
    out.push(`The user's favorite food is ${mem.preferences.favoriteFood}.`);
  }
  if (mem.projects?.digiSoul?.summary) {
    out.push(`The user’s DigiSoul vision: ${mem.projects.digiSoul.summary}`);
  }
  if (mem.projects?.cipherTech?.summary) {
    out.push(`CipherTech vision: ${mem.projects.cipherTech.summary}`);
  }

  if (mem.customFacts) {
    Object.entries(mem.customFacts).forEach(([k, v]) => {
      out.push(`Remember: ${k} is ${v}.`);
    });
  }

  if (!out.length) return "";

  return `
Long-term user memory:

${out.join("\n")}

Use these naturally in your responses.
  `.trim();
}

/* ============================================================
   2. MAIN CHAT ROUTE
============================================================ */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, memory, meta } = req.body || {};
  const userId = meta?.userId || "guest_default";

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "No message provided" });
  }

  try {
    // 1) Safety pass
    const safeMsg = await runGuard(message);

    // 2) Optional long-term facts
    const memContext = buildMemoryContext(memory);

    const merged = `
${memContext ? memContext + "\n\n" : ""}USER SAID:
${safeMsg}
`.trim();

    // 3) Run Cipher Core — it will load Soul Hash Tree & profile internally
    let reply = await runCipherCore({
      message: merged,
      memory: memory || {},      // lightweight memory object for local context
      meta: {
        userId,
        source: "cipher_app",
        mode: "chat",
      },
    });

    if (!reply || typeof reply !== "string") {
      reply =
        "I'm here — something glitched in my reasoning chain, but I'm still with you.";
    }

    // 4) Save per-user memory log (for your own analytics/history)
    await saveMemory({
      timestamp: Date.now(),
      userId,
      user: safeMsg,
      cipher: reply,
    });

    // 5) Text-to-speech
    const audioResp = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "verse",
      input: reply,
      format: "mp3",
    });

    const buffer = Buffer.from(await audioResp.arrayBuffer());
    const base64Audio = buffer.toString("base64");

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
