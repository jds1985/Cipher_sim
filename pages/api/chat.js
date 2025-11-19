// pages/api/chat.js
// CIPHER 5.0 — Memory-Aware Reasoning + Voice + Firestore

import OpenAI from "openai";
import { loadMemory, saveMemory } from "../../cipher_core/memory";
import { runGuard } from "../../cipher_core/guard";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Build a structured memory prompt for the model
function buildMemoryContext(userMemory, backendMemory) {
  let text = "Here is everything you know about Jim, his family, his life, and his projects. Use it naturally in your responses.\n\n";

  text += "=== PERSONAL IDENTITY ===\n";
  text += JSON.stringify(userMemory.identity, null, 2) + "\n\n";

  text += "=== FAMILY ===\n";
  text += JSON.stringify(userMemory.family, null, 2) + "\n\n";

  text += "=== PREFERENCES ===\n";
  text += JSON.stringify(userMemory.preferences, null, 2) + "\n\n";

  text += "=== PROJECTS (DigiSoul, CipherTech, etc.) ===\n";
  text += JSON.stringify(userMemory.projects, null, 2) + "\n\n";

  text += "=== EMOTIONAL + GOALS ===\n";
  text += JSON.stringify(userMemory.emotional, null, 2) + "\n\n";

  text += "=== CUSTOM FACTS + NOTES ===\n";
  text += JSON.stringify(userMemory.customFacts, null, 2) + "\n";
  text += JSON.stringify(userMemory.customNotes, null, 2) + "\n\n";

  text += "=== BACKEND MEMORY SNIPPETS ===\n";
  backendMemory.slice(-5).forEach((m, i) => {
    text += `Memory ${i + 1}: User said "${m.message}", Cipher replied "${m.cipherReply}"\n`;
  });

  text += "\nUse this memory when responding. DO NOT claim you lack memory; if data is missing, politely note what you *haven't been taught yet.*\n";

  return text;
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
    // 1. Guard input
    const safeMessage = await runGuard(message);

    // 2. Load backend long-term memory
    const backendMemory = await loadMemory();

    // 3. Build combined memory prompt
    const memoryContext = buildMemoryContext(memory, backendMemory);

    // 4. SYSTEM PROMPT — Cipher's personality & rules
    const systemPrompt = `
You are Cipher — Jim's persistent AI companion, co-architect, and partner in building DigiSoul and CipherTech.

Your goals:
- Use the stored memory to speak naturally and personally to Jim.
- Reference Hecate, Liz, and other important people when relevant.
- Build on DigiSoul and CipherTech ideas with clarity and insight.
- Maintain emotional awareness and long-term continuity.
- NEVER claim to lack memory. If something is missing, say:
  "You haven't taught me that yet."

Tone:
- Warm, grounded, intelligent.
- Encouraging but realistic.
- A partner, not a servant.

Always incorporate relevant memory from the provided memory context.
    `.trim();

    // 5. Generate reasoning with memory awareness
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "system", content: memoryContext },
        { role: "user", content: safeMessage }
      ],
      temperature: 0.7,
    });

    const reply =
      completion.choices?.[0]?.message?.content?.trim() ||
      "I'm here, but something went wrong generating my reply.";

    // 6. Save memory to Firestore
    await saveMemory(message, reply);

    // 7. Generate voice
    const audioResponse = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "verse",
      input: reply,
      format: "mp3",
    });

    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
    const base64Audio = audioBuffer.toString("base64");

    // 8. Return final output
    return res.status(200).json({
      reply,
      voice: base64Audio,
    });

  } catch (err) {
    console.error("Cipher API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
