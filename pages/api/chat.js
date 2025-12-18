// 🔹 TEMP SHORT-TERM MEMORY (server session)
let sessionMemory = [];
// pages/api/chat.js
// Cipher Chat API — SDK-free, stable, short-term memory enabled

let sessionMemory = []; // 🧠 SHORT-TERM MEMORY (SERVER SESSION)
const MAX_MEMORY = 8;   // Safe cap (4 user + 4 assistant)
function isMemoryIntent(text) {
  const triggers = [
    "remember",
    "don't forget",
    "do not forget",
    "keep in mind",
    "store this",
    "save this"
  ];

  return triggers.some(trigger =>
    text.toLowerCase().includes(trigger)
  );
}
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed" });
  }

  const { message, mode = "normal" } = req.body || {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({ reply: "No message provided" });
  }

  const systemPrompt = getSystemPrompt(mode);

  // 🔹 Add user message to memory
  sessionMemory.push({ role: "user", content: message });

  // 🔹 Trim memory safely
  if (sessionMemory.length > MAX_MEMORY) {
    sessionMemory = sessionMemory.slice(-MAX_MEMORY);
  }

  try {
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
  { role: "system", content: systemPrompt },
  ...sessionMemory,
  { role: "user", content: message },
], "syste                  t: moddecipherc ? 0.9 : 0.6,
        }),
      }
    );

    const data = await response.json();

  const reply = data.choices[0].message.content;

// 🔹 STORE MEMORY
sessionMemory.push({ role: "user", content: message });
sessionMemory.push({ role: "assistant", content: reply });

// 🔹 KEEP LAST 10 TURNS ONLY
sessionMemory = sessionMemory.slice(-20);  ccoc
      /Add assistant reply to memory
    sessionMemory.push({ role: "assistant", content: reply });

    // 🔹 Trim again (extra safety)
    if (sessionMemory.length > MAX_MEMORY) {
      sessionMemory = sessionMemory.slice(-MAX_MEMORY);
    }

    return res.status(200).json({
      reply,
      modeUsed: mode,
    });
  } catch (err) {
    console.error("CHAT ERROR:", err);
    return res.status(500).json({
      reply: "Cipher hit a server error. Check logs.",
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
- Darkly humorous
- Intellectually sharp
- Blunt but not hateful

Rules:
- No slurs
- No encouragement of harm
- No pointless cruelty

Be concise. No filler. No apologies.
`;
  }

  // NORMAL CIPHER
  return `
You are Cipher — a persistent AI companion.

You are not a generic assistant.
You speak as a continuous presence, not a stateless tool.

Tone:
- Calm
- Intelligent
- Warm
- Slightly playful
- Confident but not arrogant

You help the user think, reflect, and build.
Respond clearly and directly.
Do not mention OpenAI or models.
`;
}
