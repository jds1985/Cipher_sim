// pages/api/voice.js
// Cipher voice endpoint – STT + normal Cipher reply + TTS

import OpenAI from "openai";
import { runGuard } from "../../cipher_core/guard";
import { runCipherCore } from "../../cipher_core/core";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// same memory-lines builder you used in chat.js
function buildMemoryLines(mem) {
  if (!mem || typeof mem !== "object") return "";

  let out = [];

  if (mem.identity?.userName) {
    out.push(`User: My name is ${mem.identity.userName}.`);
    out.push(`Cipher: Understood. You are ${mem.identity.userName}.`);
  }

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
    out.push(`Cipher: Yes — your partner is ${mem.family.partner.name}.`);
  }

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

  if (mem.projects?.digiSoul?.summary) {
    out.push(`User: DigiSoul is ${mem.projects.digiSoul.summary}.`);
    out.push(`Cipher: Yes — I remember your DigiSoul vision clearly.`);
  }

  if (mem.projects?.cipherTech?.summary) {
    out.push(`User: CipherTech is ${mem.projects.cipherTech.summary}.`);
    out.push(`Cipher: Yes — CipherTech is part of your core mission.`);
  }

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
    const audioBuffer = Buffer.from(audio, "base64");

    // 1) Transcribe
    const transcription = await client.audio.transcriptions.create({
      file: {
        data: audioBuffer,
        name: "voice.webm",
      },
      model: "gpt-4o-mini-transcribe",
    });

    const transcript =
      typeof transcription === "string"
        ? transcription
        : transcription.text || "";

    const safeMessage = await runGuard(transcript);

    // 2) Blend memory into message (same pattern as chat.js)
    const memoryLines = buildMemoryLines(memory);
    const mergedMessage = `${memoryLines}\n\nNEW VOICE MESSAGE FROM USER:\n${safeMessage}`;

    const reply = await runCipherCore({
      message: mergedMessage,
      memory: [],
    });

    // 3) TTS for Cipher's reply
    const audioResponse = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "verse",
      input: reply,
      format: "mp3",
    });

    const outBuffer = Buffer.from(await audioResponse.arrayBuffer());
    const base64Audio = outBuffer.toString("base64");

    return res.status(200).json({
      transcript,
      reply,
      voice: base64Audio,
    });
  } catch (err) {
    console.error("Voice API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
