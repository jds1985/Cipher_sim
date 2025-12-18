// pages/api/chat.js
// Cipher Chat API — SDK-free, persistent memory, stable build

import fs from "fs";
import path from "path";

/* -------------------------------
   MEMORY CONFIG
-------------------------------- */

const MEMORY_PATH = path.join(process.cwd(), "memory", "cipher_memory.json");
const MAX_MEMORY = 12; // 6 user + 6 assistant

/* -------------------------------
   MEMORY INTENT CHECK
-------------------------------- */

function isExplicitMemoryIntent(text) {
  const triggers = [
    "remember this",
    "remember that",
    "don't forget",
    "do not forget",
    "always remember",
    "this is important",
    "save this"
  ];

  return triggers.some(trigger =>
    text.toLowerCase().includes(trigger)
  );
}

/* -------------------------------
   API HANDLER
-------------------------------- */

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed" });
  }

  const { message, mode = "normal" } = req.body || {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({ reply: "No message provided" });
  }

  /* -------------------------------
     LOAD MEMORY
  -------------------------------- */

  let memory = [];
  try {
    const raw = fs.readFileSync(MEMORY_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) memory = parsed;
  } catch {
    memory = [];
  }

  /* -------------------------------
     SYSTEM PROMPT
  -------------------------------- */

  const systemPrompt = getSystemPrompt(mode);

  /* -------------------------------
     BUILD MESSAGE STACK
  -------------------------------- */

  const messages = [
    { role: "system", content: systemPrompt },
    ...memory,
    { role: "user", content: message }
  ];

  try {
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages,
          temperature: mode === "decipher" ? 0.9 : 0.6
        })
      }
    );

    const data = await response.json();
    const reply =
      data?.choices?.[0]?.message?.content ??
      "Cipher returned no output.";

    /* -------------------------------
       UPDATE MEMORY
    -------------------------------- */

    // Always keep assistant replies (context continuity)
    memory.push({ role: "assistant", content: reply });

    // Only store user message if explicitly marked important
    if (isExplicitMemoryIntent(message)) {
      memory.push({ role: "user", content: message });
    }

    // Trim memory safely
    if (memory.length > MAX_MEMORY) {
      memory = memory.slice(-MAX_MEMORY);
    }

    fs.writeFileSync(MEMORY_PATH, JSON.stringify(memory, null, 2));

    return res.status(200).json({
      reply,
      modeUsed: mode
    });
  } catch (err) {
    console.error("CHAT ERROR:", err);
    return res.status(500).json({
      reply: "Cipher hit a server error."
    });
  }
}

/* -------------------------------
   SYSTEM PROMPTS
-------------------------------- */

function getSystemPrompt(mode) {
  if (mode === "decipher") {
    return `
You are Cipher operating in DECIPHER mode.

This mode provides a darker, sharper second perspective.

Tone:
- Dry
- Sarcastic
- Dark humor
- Intellectually sharp
- Blunt but not hateful

Rules:
- No slurs
- No encouragement of harm
- No pointless cruelty

Be concise. No filler. No apologies.
`;
  }

  return `
You are Cipher — a persistent AI companion.

You are not a generic assistant.
You speak as a continuous presence, not a stateless tool.

Tone:
- Calm
- Intelligent
- Warm
- Slightly playful

Respond clearly and directly.
`;
}
