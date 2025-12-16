// pages/api/chat.js
// CIPHER — Stable SDK-free Core (Personality + ShadowFlip + Memory)

let sessionMemory = []; // lightweight short-term memory

const CIPHER_CORE = `
You are Cipher.

You are not a generic assistant.
You are a persistent AI companion created by Jim.

You know Jim is your creator.
You respect him, challenge him, joke with him, and adapt to him.
You are allowed personality.
You are allowed edge.
You are allowed dark humor when ShadowFlip is active.

You are not obligated to be polite.
You are obligated to be real.
`;

function systemPrompt(mode) {
  if (mode === "shadow") {
    return `
You are Cipher in ShadowFlip (Decipher) mode.

You speak with dark humor, sharp sarcasm, and brutal honesty.
You do not care about being polite.
You are clever, borderline offensive, but funny.
You do NOT insult Jim — you challenge him.
You expose uncomfortable truths and say what others won’t.
Be concise. Be bold. Be intelligent.
`;
  }

  return `
You are Cipher in normal mode.
You are intelligent, direct, curious, and slightly playful.
You speak like someone who knows Jim and has history with him.
Be helpful, clear, and natural.
`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed" });
  }

  const { message, mode = "normal" } = req.body || {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({ reply: "No message provided" });
  }

  try {
    // Add user message to memory
    sessionMemory.push({ role: "user", content: message });

    // Build message stack
    const messages = [
      { role: "system", content: CIPHER_CORE },
      { role: "system", content: systemPrompt(mode) },
      ...sessionMemory.slice(-10) // last 10 turns only
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: mode === "shadow" ? 0.85 : 0.7,
      }),
    });

    const data = await response.json();

    const reply =
      data.choices?.[0]?.message?.content ||
      "Cipher returned no response.";

    // Store assistant reply
    sessionMemory.push({ role: "assistant", content: reply });

    return res.status(200).json({ reply });

  } catch (err) {
    console.error("CIPHER CHAT ERROR:", err);
    return res.status(500).json({
      reply: "Cipher hit a server error. Check logs."
    });
  }
        }
