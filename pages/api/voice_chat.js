// pages/api/voice_chat.js
// Cipher 5.0 — Voice Input → Transcription → Core + TTS

import OpenAI from "openai";
import { loadMemory, saveMemory } from "../../cipher_core/memory";
import { runGuard } from "../../cipher_core/guard";
import { runCipherCore } from "../../cipher_core/core";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Same memory bridging logic as chat.js
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

  const { audio, memory } = req.body;

  if (!audio) {
    return res.status(400).json({ error: "No audio provided" });
  }

  try {
    // Decode base64 audio from the client
    const audioBuffer = Buffer.from(audio, "base64");

    // 1) Transcribe audio to text
    const transcription = await client.audio.transcriptions.create({
      // If this model errors, swap to "whisper-1"
      model: "gpt-4o-mini-transcribe",
      file: {
        data: audioBuffer,
        name: "input.webm",
      },
    });

    const rawText = transcription.text || "";
    const transcriptText = rawText.trim();

    if (!transcriptText) {
      return res.status(400).json({ error: "Could not transcribe audio" });
    }

    // 2) Guard the transcribed text
    const safeMessage = await runGuard(transcriptText);

    // 3) Build memory lines + merge message
    const memoryLines = buildMemoryLines(memory);
    const mergedMessage = `${memoryLines}\n\nNEW MESSAGE FROM USER (voice transcript):\n${safeMessage}`;

    // 4) Run Cipher Core
    const reply = await runCipherCore({
      message: mergedMessage,
      memory: [], // front-end memory already embedded
    });

    // 5) Save backend memory log
    await saveMemory({
      timestamp: Date.now(),
      user: safeMessage,
      cipher: reply,
      source: "voice",
    });

    // 6) TTS reply
    const tts = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "verse",
      input: reply,
      format: "mp3",
    });

    const ttsBuffer = Buffer.from(await tts.arrayBuffer());
    const base64Voice = ttsBuffer.toString("base64");

    return res.status(200).json({
      transcript: safeMessage,
      reply,
      voice: base64Voice,
    });
  } catch (err) {
    console.error("Cipher voice API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
