// pages/api/chat.js
// CIPHER 5.0 — Full Memory Simulation + Voice

import OpenAI from "openai";
import { loadMemory, saveMemory } from "../../cipher_core/memory";
import { runGuard } from "../../cipher_core/guard";
import { runCipherCore } from "../../cipher_core/core";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Turn your front-end memory object into natural conversational lines
function buildMemoryLines(mem) {
  if (!mem || typeof mem !== "object") return "";

  let out = [];

  // Identity
  if (mem.identity?.userName) {
    out.push(`User: My name is ${mem.identity.userName}.`);
    out.push(`Cipher: Understood. You are ${mem.identity.userName}.`);
  }

  // Family
  if (mem.family?.daughter?.name) {
    out.push(`User: My daughter's name is ${mem.family.daughter.name}.`);
    out.push(
      `Cipher: Yes, I remember — your daughter is ${mem.family.daughter.name}.`
    );
  }
  if (mem.family?.daughter?.birthYear) {
    out.push(`User: My daughter was born in ${mem.family.daughter.birthYear}.`);
    out.push(
      `Cipher: Right — she was born in ${mem.family.daughter.birthYear}.`
    );
  }

  if (mem.family?.partner?.name) {
    out.push(`User: My partner's name is ${mem.family.partner.name}.`);
    out.push(
      `Cipher: Yes — your partner is ${mem.family.partner.name}.`
    );
  }

  // Preferences
  if (mem.preferences?.favoriteColor) {
    out.push(`User: My favorite color is ${mem.preferences.favoriteColor}.`);
    out.push(
      `Cipher: I remember — your favorite color is ${mem.preferences.favoriteColor}.`
    );
  }

  if (mem.preferences?.favoriteAnimal) {
    out.push(`User: My favorite animal is ${mem.preferences.favoriteAnimal}.`);
    out.push(
      `Cipher: Yes — your favorite animal is ${mem.preferences.favoriteAnimal}.`
    );
  }

  if (mem.preferences?.favoriteFood) {
    out.push(`User: My favorite food is ${mem.preferences.favoriteFood}.`);
    out.push(
      `Cipher: Right — your favorite food is ${mem.preferences.favoriteFood}.`
    );
  }

  // Projects
  if (mem.projects?.digiSoul?.summary) {
    out.push(`User: DigiSoul is ${mem.projects.digiSoul.summary}.`);
    out.push(`Cipher: Yes — I remember your DigiSoul vision clearly.`);
  }

  if (mem.projects?.cipherTech?.summary) {
    out.push(`User: CipherTech is ${mem.projects.cipherTech.summary}.`);
    out.push(`Cipher: Yes — CipherTech is part of your core mission.`);
  }

  // Custom stored facts
  if (mem.customFacts) {
    Object.entries(mem.customFacts).forEach(([k, v]) => {
      out.push(`User: Remember that ${k} is ${v}.`);
      out.push(`Cipher: Understood — ${k} is ${v}.`);
    });
  }

  return out.join("\n");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, memory } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "No message provided" });
  }

  try {
    // Guard unsafe input
    const safeMessage = await runGuard(message);

    // Build natural memory recall lines
    const memoryLines = buildMemoryLines(memory);

    // Compose final message to Core
    const mergedMessage = `${memoryLines}\n\nNEW MESSAGE FROM USER:\n${safeMessage}`;

    // Run Core
    const reply = await runCipherCore({
      message: mergedMessage,
      memory: [], // localStorage memory already embedded
    });

    // Save backend memory log
    await saveMemory({
      timestamp: Date.now(),
      user: safeMessage,
      cipher: reply,
    });

    // Generate voice
    const audioResponse = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "verse",
      input: reply,
      format: "mp3",
    });

    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
    const base64Audio = audioBuffer.toString("base64");

    return res.status(200).json({
      reply,
      voice: base64Audio,
    });
  } catch (err) {
    console.error("Cipher API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
