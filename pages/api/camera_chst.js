// pages/api/camera_chat.js
// Cipher – Single-image vision + memory + voice

import OpenAI from "openai";
import { runGuard } from "../../cipher_core/guard";
import { runCipherCore } from "../../cipher_core/core";
import { saveMemory } from "../../cipher_core/memory";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Re-use the same memory->lines pattern as chat.js
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

  const { image, memory } = req.body;

  if (!image || typeof image !== "string") {
    return res.status(400).json({ error: "No image provided" });
  }

  try {
    // 1) Get a short description of the image using vision
    const visionResponse = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You are Cipher viewing an image for Jim. Briefly describe what you see in 2–4 sentences, and keep it grounded and helpful.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Describe this image for me.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${image}`,
              },
            },
          ],
        },
      ],
    });

    const description =
      visionResponse.choices?.[0]?.message?.content?.toString() ||
      "I see an image, but I couldn't get a clear description.";

    // Run guard on the description just in case
    const safeDescription = await runGuard(description);

    // 2) Feed description + memory into Cipher Core
    const memoryLines = buildMemoryLines(memory || {});
    const mergedMessage = `${memoryLines}\n\nNEW VISION INPUT FROM USER (image description):\n${safeDescription}`;

    const reply = await runCipherCore({
      message: mergedMessage,
      memory: [],
    });

    // 3) Log memory
    await saveMemory({
      timestamp: Date.now(),
      user: "[IMAGE] " + safeDescription,
      cipher: reply,
    });

    // 4) Turn reply into voice
    const audioResponse = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "verse",
      input: reply,
      format: "mp3",
    });

    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
    const base64Audio = audioBuffer.toString("base64");

    return res.status(200).json({
      description: safeDescription,
      reply,
      voice: base64Audio,
    });
  } catch (err) {
    console.error("Cipher camera API error:", err);
    return res.status(500).json({ error: err.message || "Camera error" });
  }
}
